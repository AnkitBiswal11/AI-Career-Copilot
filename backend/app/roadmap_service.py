
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


def generate_career_roadmap(
    resume_text: str,
    job_description: str,
    settings: dict | None = None,
) -> dict:
    settings = settings or {}

    aggressive_mode = bool(settings.get("aggressiveMode", False))
    include_genai = bool(settings.get("includeGenAI", True))
    prioritize_dsa = bool(settings.get("prioritizeDSA", True))

    if aggressive_mode:
        pace_instruction = """
- Use an intensive learning plan with a faster pace.
- Prefer focused daily tasks and shorter stage durations.
- Keep the workload realistic and achievable for a student.
"""
    else:
        pace_instruction = """
- Use a balanced, sustainable learning plan.
- Allow enough time to understand and practice each topic.
- Avoid overloading the candidate with too many tasks.
"""

    if include_genai:
        genai_instruction = """
- Include relevant Generative AI and AI tools when useful for the target role.
- Do not add unrelated GenAI topics just to fill the roadmap.
"""
    else:
        genai_instruction = """
- Do not include Generative AI or AI-tool learning tasks.
- Focus on the core skills required for the target role instead.
"""

    if prioritize_dsa:
        dsa_instruction = """
- Give Data Structures and Algorithms high priority.
- Include DSA practice in an early stage when relevant to the target role.
- Include problem-solving practice appropriate for placement preparation.
"""
    else:
        dsa_instruction = """
- Include DSA only when relevant to the target role.
- Do not make DSA the main focus of the roadmap.
- Give appropriate attention to role-specific skills and projects.
"""

    prompt = f"""
You are an expert career coach for computer science students and fresh graduates.

Create a personalized career roadmap for the candidate based on their resume,
target job description, and learning preferences.

IMPORTANT RULES:

- Use ONLY skills and experience explicitly demonstrated in the resume
  when describing the candidate's current level.
- Do NOT invent projects, skills, experience, certifications, or achievements.
- Identify the most important skills needed for the target role.
- Prioritize missing skills from the target job.
- Make the roadmap realistic for a fresher.
- The roadmap should focus on practical placement preparation.
- Include technical skills, projects, interview preparation, and job readiness
  when relevant to the target role.
- Order stages logically.
- Keep each stage actionable.
- Each stage should contain 3-6 concrete learning/action items.
- Estimate realistic duration in days.
- Completion should initially be 0 for all stages.
- Follow the candidate's learning preferences below.
- Return ONLY valid JSON.
- Do not use markdown.

LEARNING PREFERENCES:

Aggressive mode: {"Enabled" if aggressive_mode else "Disabled"}
Include GenAI: {"Enabled" if include_genai else "Disabled"}
Prioritize DSA: {"Enabled" if prioritize_dsa else "Disabled"}

LEARNING PACE:
{pace_instruction}

GENAI PREFERENCE:
{genai_instruction}

DSA PREFERENCE:
{dsa_instruction}

Return EXACTLY this structure:

{{
    "target_role": "",
    "readiness_score": 0,
    "summary": "",
    "stages": [
        {{
            "id": 1,
            "title": "",
            "status": "current",
            "duration_days": 7,
            "completion": 0,
            "items": [
                {{
                    "label": "",
                    "done": false
                }}
            ]
        }}
    ],
    "insights": [],
    "recommendations": []
}}

STATUS RULES:

- The first stage should be "current".
- All later stages should be "upcoming".
- Use only these status values:
  "completed"
  "current"
  "upcoming"

READINESS SCORE:

- Must be between 0 and 100.
- Estimate based on the candidate's demonstrated skills compared with
  the target job requirements.

STAGE GUIDANCE:

Create approximately 4-6 stages.

Possible stages include:

1. Foundations / DSA
2. Core technical skills
3. Backend / frontend / domain skills
4. Projects and practical implementation
5. Interview preparation
6. Placement readiness

Only include stages that are relevant to the target role.

RESUME:
{resume_text}

TARGET JOB:
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

        # Readiness score
        try:
            readiness_score = int(
                result.get("readiness_score", 0)
            )
        except (TypeError, ValueError):
            readiness_score = 0

        readiness_score = max(0, min(readiness_score, 100))

        # Target role
        target_role = str(
            result.get("target_role", "")
        ).strip()

        # Summary
        summary = str(
            result.get("summary", "")
        ).strip()

        # Clean stages
        stages = []
        raw_stages = result.get("stages", [])

        if isinstance(raw_stages, list):
            for index, stage in enumerate(raw_stages):
                if not isinstance(stage, dict):
                    continue

                title = str(
                    stage.get("title", "")
                ).strip()

                if not title:
                    continue

                stage_id = len(stages) + 1

                try:
                    duration_days = int(
                        stage.get("duration_days", 7)
                    )
                except (TypeError, ValueError):
                    duration_days = 7

                duration_days = max(
                    1,
                    min(duration_days, 120),
                )

                status = "current" if not stages else "upcoming"

                items = []
                raw_items = stage.get("items", [])

                if isinstance(raw_items, list):
                    for item in raw_items:
                        if isinstance(item, dict):
                            label = str(
                                item.get("label", "")
                            ).strip()
                        else:
                            label = str(item).strip()

                        if not label:
                            continue

                        items.append({
                            "label": label,
                            "done": False,
                        })

                items = items[:6]

                if not items:
                    continue

                stages.append({
                    "id": stage_id,
                    "title": title,
                    "status": status,
                    "duration_days": duration_days,
                    "completion": 0,
                    "items": items,
                })

        def clean_list(value):
            if not isinstance(value, list):
                return []

            return [
                str(item).strip()
                for item in value
                if str(item).strip()
            ]

        return {
            "target_role": target_role,
            "readiness_score": readiness_score,
            "summary": summary,
            "stages": stages,
            "insights": clean_list(
                result.get("insights")
            ),
            "recommendations": clean_list(
                result.get("recommendations")
            ),
        }

    except json.JSONDecodeError:
        return {
            "target_role": "",
            "readiness_score": 0,
            "summary": "",
            "stages": [],
            "insights": [],
            "recommendations": [],
            "error": "AI returned an invalid JSON response.",
        }

    except Exception as exc:
        return {
            "target_role": "",
            "readiness_score": 0,
            "summary": "",
            "stages": [],
            "insights": [],
            "recommendations": [],
            "error": f"Roadmap generation failed: {str(exc)}",
        }