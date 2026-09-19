import json
import ollama


def _clean_json_response(content: str) -> dict:
    """
    Safely convert the Ollama response into a Python dictionary.
    """

    content = content.strip()
    

    # Remove markdown code fences if the model returns them.
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


def generate_interview_question(
    resume_text: str,
    job_description: str,
    role: str,
    interview_type: str,
    difficulty: str,
    previous_questions: list[str],
) -> dict:

    previous = "\n".join(
        f"- {question}"
        for question in previous_questions
    )

    if not previous:
        previous = "None"

    prompt = f"""
You are an expert technical interviewer.

Create ONE interview question for a candidate.

Candidate role:
{role}

Interview type:
{interview_type}

Difficulty:
{difficulty}

Candidate resume:
{resume_text[:12000]}

Job description:
{job_description[:10000]}

Previous questions:
{previous}

Do not repeat a previous question.

Return ONLY valid JSON.

Use exactly this structure:

{{
  "question": "interview question",
  "topic": "topic being tested"
}}
"""

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

    return _clean_json_response(response["message"]["content"])


def evaluate_interview_answer(
    question: str,
    answer: str,
    resume_text: str,
    job_description: str,
) -> dict:

    prompt = f"""
You are an expert interviewer evaluating a candidate's answer.

Question:
{question}

Candidate answer:
{answer}

Candidate resume:
{resume_text[:10000]}

Job description:
{job_description[:8000]}

Evaluate the answer fairly.

Score it from 0 to 10.

Consider:
- Technical correctness
- Relevance
- Clarity
- Depth
- Practical understanding

Return ONLY valid JSON.

Use exactly this structure:

{{
  "score": 0,
  "feedback": "overall feedback",
  "strengths": [
    "strength 1",
    "strength 2"
  ],
  "weaknesses": [
    "weakness 1",
    "weakness 2"
  ],
  "improvement_tips": [
    "tip 1",
    "tip 2"
  ],
  "ideal_answer": "a strong example answer"
}}
"""

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

    result = _clean_json_response(response["message"]["content"])

    # Keep score safely between 0 and 10.
    try:
        result["score"] = max(
            0,
            min(10, int(result.get("score", 0)))
        )
    except (TypeError, ValueError):
        result["score"] = 0

    return result