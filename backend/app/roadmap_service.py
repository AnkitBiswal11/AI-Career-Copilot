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
) -> dict:

    prompt = f"""
You are an expert career coach for computer science students and fresh graduates.

Create a personalized career roadmap for the candidate based on their resume
and target job description.

IMPORTANT RULES:

- Use ONLY skills and experience explicitly demonstrated in the resume
  when describing the candidate's current level.
- Do NOT invent projects, skills, experience, certifications, or achievements.
- Identify the most important skills needed for the target role.
- Prioritize missing skills from the target job.
- Make the roadmap realistic for a fresher.
- The roadmap should focus on practical placement preparation.
- Include DSA, technical skills, projects, interview preparation, and job readiness
  when relevant to the target role.
- Order stages logically.
- Keep each stage actionable.
- Each stage should contain 3-6 concrete learning/action items.
- Estimate realistic duration in days.
- Completion should initially be 0 for all stages.
- Return ONLY valid JSON.
- Do not use markdown.

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

        # --------------------------------
        # Readiness score
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
        # Target role
        # --------------------------------
        target_role = str(
            result.get("target_role", "")
        ).strip()

        # --------------------------------
        # Summary
        # --------------------------------
        summary = str(
            result.get("summary", "")
        ).strip()

        # --------------------------------
        # Clean stages
        # --------------------------------
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

                # Stage ID
                stage_id = index + 1

                # Duration
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

                # Completion starts at zero
                completion = 0

                # Status
                if index == 0:
                    status = "current"
                else:
                    status = "upcoming"

                # --------------------------------
                # Clean stage items
                # --------------------------------
                items = []

                raw_items = stage.get(
                    "items",
                    [],
                )

                if isinstance(raw_items, list):

                    for item in raw_items:

                        if isinstance(item, dict):

                            label = str(
                                item.get("label", "")
                            ).strip()

                        else:

                            label = str(
                                item
                            ).strip()

                        if not label:
                            continue

                        items.append(
                            {
                                "label": label,
                                "done": False,
                            }
                        )

                # Limit items
                items = items[:6]

                if not items:
                    continue

                stages.append(
                    {
                        "id": stage_id,
                        "title": title,
                        "status": status,
                        "duration_days": duration_days,
                        "completion": completion,
                        "items": items,
                    }
                )

        # --------------------------------
        # Generic list cleaner
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