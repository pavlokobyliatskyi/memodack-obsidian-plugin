import base64
import json
from io import BytesIO
from gtts import gTTS
from deep_translator import GoogleTranslator


X_API_KEY = "x-api-key"  # <-- Change
X_API_VERSION = "1"


def lambda_handler(event, context):
    try:

        path = event["requestContext"]["http"]["path"]

        # Root
        if path == "/":
            return json.dumps({"status": "error", "message": "Not Found"})

        x_api_key = event["headers"].get("x-api-key")
        x_api_version = event["headers"].get("x-api-version")

        # Auth
        if x_api_key != X_API_KEY or x_api_version != X_API_VERSION:
            return json.dumps(
                {
                    "status": "error",
                    "message": "Unauthorized: Invalid API key or version",
                }
            )

        queryStringParameters = event.get("queryStringParameters")

        if not queryStringParameters:
            return json.dumps(
                {"status": "error", "message": "Missing query parameters"}
            )

        source = queryStringParameters.get("source")  # language

        if not source:
            return json.dumps(
                {"status": "error", "message": "Missing 'source' in query parameters"}
            )

        text = queryStringParameters.get("text")

        if not text:
            return json.dumps(
                {"status": "error", "message": "Missing 'text' in query parameters"}
            )

        # Translate
        if path == "/translate":
            target = queryStringParameters.get("target")

            if not target:
                return json.dumps(
                    {
                        "status": "error",
                        "message": "Missing 'target' in query parameters",
                    }
                )

            translation = GoogleTranslator(source=source, target=target).translate(text)

            return json.dumps(
                {"status": "success", "data": {"translation": translation}}
            )

        # TTS
        if path == "/tts":
            # Generate audio using gTTS
            mp3_fp = BytesIO()
            tts = gTTS(text, lang=source)
            tts.write_to_fp(mp3_fp)
            mp3_fp.seek(0)

            # Convert audio to base64
            audio_base64 = base64.b64encode(mp3_fp.read()).decode("utf-8")

            # Format the response as a base64 URL
            base64Url = f"data:audio/mp3;base64,{audio_base64}"

            return json.dumps({"status": "success", "data": {"audioUrl": base64Url}})

    except KeyError as e:
        return json.dumps({"status": "error", "message": f"Missing key: {str(e)}"})
    except Exception as e:
        return json.dumps(
            {"status": "error", "message": f"An error occurred: {str(e)}"}
        )
