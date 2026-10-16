import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("stillgood.ai")

class GeminiService:
    """
    Official Google GenAI Client wrapper supporting Vertex AI and Gemini Developer API.
    Maintains transparency: explicitly tracks whether live Gemini or deterministic fallback is active.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT")
        self.location = os.getenv("GOOGLE_CLOUD_REGION", "us-central1")
        self.is_live = False
        self.client = None

        if self.api_key or self.project_id:
            try:
                from google import genai
                if self.api_key:
                    self.client = genai.Client(api_key=self.api_key)
                    self.is_live = True
                    logger.info("Initialized Google GenAI SDK with API Key.")
                elif self.project_id:
                    self.client = genai.Client(vertexai=True, project=self.project_id, location=self.location)
                    self.is_live = True
                    logger.info(f"Initialized Google GenAI SDK with Vertex AI (Project: {self.project_id}).")
            except Exception as e:
                logger.warning(f"Could not initialize live GenAI client: {e}. Falling back to deterministic engine.")
                self.is_live = False
        else:
            logger.info("No GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT configured; using verified deterministic logic.")

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_live_gemini": self.is_live,
            "provider": "Vertex AI / Google GenAI SDK" if self.is_live else "Deterministic Verified Fallback",
            "model": "gemini-2.5-flash" if self.is_live else "Deterministic Rules Engine",
            "notice": (
                "Connected to live Gemini 2.5 Flash via official Google GenAI SDK."
                if self.is_live else
                "Operating in offline deterministic mode. Set GEMINI_API_KEY in environment to enable live Gemini API calls."
            )
        }

    def generate_content(self, prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        if not self.is_live or not self.client:
            return None
        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                top_p=0.95
            )
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=config
            )
            return response.text
        except Exception as e:
            logger.error(f"Error calling live Gemini model: {e}")
            return None

# Singleton instance
gemini_service = GeminiService()
