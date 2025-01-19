import base64
import json
from io import BytesIO
from http.server import BaseHTTPRequestHandler, HTTPServer
import socket
from urllib.parse import urlparse, parse_qs
from gtts import gTTS
from deep_translator import GoogleTranslator

X_API_KEY = "x-api-key"  # <-- Change
X_API_VERSION = "1"

HOST = "0.0.0.0"
PORT = 8080


class RequestHandler(BaseHTTPRequestHandler):
    def _send_response(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_GET(self):
        try:
            # Parse request path and query parameters
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            query_params = parse_qs(parsed_url.query)

            # Root endpoint
            if path == "/":
                self._send_response(404, {"status": "error", "message": "Not Found"})
                return

            # API key and version validation
            headers = self.headers
            x_api_key = headers.get("x-api-key")
            x_api_version = headers.get("x-api-version")

            if x_api_key != X_API_KEY or x_api_version != X_API_VERSION:
                self._send_response(
                    401,
                    {
                        "status": "error",
                        "message": "Unauthorized: Invalid API key or version",
                    },
                )
                return

            # Validate query parameters
            source = query_params.get("source", [None])[0]
            text = query_params.get("text", [None])[0]

            if not source:
                self._send_response(
                    400,
                    {
                        "status": "error",
                        "message": "Missing 'source' in query parameters",
                    },
                )
                return

            if not text:
                self._send_response(
                    400,
                    {
                        "status": "error",
                        "message": "Missing 'text' in query parameters",
                    },
                )
                return

            # Translate endpoint
            if path == "/translate":
                target = query_params.get("target", [None])[0]

                if not target:
                    self._send_response(
                        400,
                        {
                            "status": "error",
                            "message": "Missing 'target' in query parameters",
                        },
                    )
                    return

                translation = GoogleTranslator(source=source, target=target).translate(
                    text
                )
                self._send_response(
                    200, {"status": "success", "data": {"translation": translation}}
                )
                return

            # TTS endpoint
            if path == "/tts":
                mp3_fp = BytesIO()
                tts = gTTS(text, lang=source)
                tts.write_to_fp(mp3_fp)
                mp3_fp.seek(0)

                # Convert audio to base64
                audio_base64 = base64.b64encode(mp3_fp.read()).decode("utf-8")
                base64_url = f"data:audio/mp3;base64,{audio_base64}"

                self._send_response(
                    200, {"status": "success", "data": {"audioUrl": base64_url}}
                )
                return

            # If the path is not recognized
            self._send_response(404, {"status": "error", "message": "Not Found"})

        except Exception as e:
            self._send_response(
                500, {"status": "error", "message": f"An error occurred: {str(e)}"}
            )


def run_server():
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    print(f"Starting server on {HOST}:{PORT}")
    print("You can access the server using the following URLs:")
    print(f"  - http://localhost:{PORT}")
    print(f"  - http://{local_ip}:{PORT}")
    print("Server running...")

    server = HTTPServer((HOST, PORT), RequestHandler)
    server.serve_forever()


if __name__ == "__main__":
    run_server()
