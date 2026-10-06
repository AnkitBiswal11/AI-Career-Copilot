import os
import ollama
from groq import Groq


OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:4b")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")


def chat(messages):
    """
    Use Groq in production when GROQ_API_KEY is available.
    Otherwise use local Ollama.
    """

    groq_api_key = os.getenv("GROQ_API_KEY")

    if groq_api_key:
        client = Groq(api_key=groq_api_key)

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.2,
        )

        return {
            "message": {
                "content": response.choices[0].message.content
            }
        }

    # Local development fallback
    response = ollama.chat(
        model=OLLAMA_MODEL,
        messages=messages,
    )

    return response