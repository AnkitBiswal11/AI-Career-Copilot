import json
import ollama


MODEL_NAME = "qwen3:4b"


def generate_coach_response(message: str, context: dict) -> dict:
    context_json = json.dumps(
        context,
        ensure_ascii=False,
        default=str,
    )

    prompt = f"""
You are Career Copilot, an AI career coach.

Your job is to answer the USER QUESTION using the PROFILE DATA.

IMPORTANT:
- PROFILE DATA is information about the user.
- Do NOT copy or reproduce the PROFILE DATA.
- Do NOT return the PROFILE DATA.
- Do NOT return the user, resume, analysis, target_job, or roadmap objects.
- You must answer the USER QUESTION.
- Your entire response MUST be one JSON object.
- The JSON object MUST contain exactly these three keys:
  "answer"
  "action_items"
  "related_skills"

PROFILE DATA:
{context_json}

USER QUESTION:
{message}

Return exactly this type of structure:

{{
  "answer": "A direct and personalized answer to the user's question.",
  "action_items": [
    "Specific action the user should take",
    "Another specific action"
  ],
  "related_skills": [
    "Python",
    "SQL"
  ]
}}

Rules:
1. Answer the user's question directly.
2. Use the profile data to personalize the answer.
3. Never return the profile data itself.
4. Never return a resume object.
5. Never return an analysis object.
6. Never return a target_job object.
7. Never return a roadmap object.
8. Do not use markdown.
9. Do not use ```json.
10. Keep the answer concise and practical.
11. Include 2-5 useful action_items.
12. Include 2-5 relevant related_skills.
13. Return ONLY the JSON object.
"""

    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a career coaching assistant. "
                        "Always follow the requested JSON output format."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            format="json",
            think=False,
        )

        raw = response["message"]["content"].strip()

        print("\n========== COACH DEBUG ==========")
        print("RAW OLLAMA RESPONSE:")
        print(raw)

        data = json.loads(raw)

        answer = data.get("answer")
        action_items = data.get("action_items")
        related_skills = data.get("related_skills")

        # Validate the expected Coach response.
        if not isinstance(answer, str) or not answer.strip():
            raise ValueError(
                "Ollama returned JSON without a valid 'answer' field."
            )

        if not isinstance(action_items, list):
            action_items = []

        if not isinstance(related_skills, list):
            related_skills = []

        result = {
            "answer": answer.strip(),
            "action_items": [
                str(item).strip()
                for item in action_items
                if str(item).strip()
            ],
            "related_skills": [
                str(skill).strip()
                for skill in related_skills
                if str(skill).strip()
            ],
        }

        print("COACH RESULT:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("================================\n")

        return result

    except Exception as e:
        print("\n========== COACH ERROR ==========")
        print("ERROR TYPE:", type(e).__name__)
        print("ERROR:", str(e))
        print("=================================\n")

        return {
            "answer": "The AI coach could not generate a response. Please try again.",
            "action_items": [],
            "related_skills": [],
        }