```python
import os
import logging

import ollama
from groq import Groq

logger = logging.getLogger(__name__)

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:4b")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")


def chat(messages):
    """
    Use Groq in production when GROQ_API_KEY is available.
    Otherwise use local Ollama.

    Return a consistent response structure for both providers.
    """
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip()

    if groq_api_key:
        client = Groq(api_key=groq_api_key)

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.1,
            max_tokens=3500,
            response_format={"type": "json_object"},
        )

        if not response.choices:
            raise RuntimeError("Groq returned no response choices.")

        content = response.choices[0].message.content

        if not content or not content.strip():
            raise RuntimeError("Groq returned an empty response.")

        return {
            "message": {
                "content": content.strip()
            }
        }

    # Local development fallback
    response = ollama.chat(
        model=OLLAMA_MODEL,
        messages=messages,
        format="json",
        options={
            "temperature": 0.1,
        },
    )

    if not isinstance(response, dict):
        try:
            response = response.model_dump()
        except AttributeError:
            raise RuntimeError(
                "Ollama returned an unsupported response format."
            )

    message = response.get("message", {})

    if not isinstance(message, dict):
        try:
            message = message.model_dump()
        except AttributeError:
            raise RuntimeError(
                "Ollama returned an unsupported message format."
            )

    content = message.get("content", "")

    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("Ollama returned an empty response.")

    return {
        "message": {
            "content": content.strip()
        }
    }
```
