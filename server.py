#!/usr/bin/env python3
"""
D&D Companion App — API Proxy Server
Serves static files AND proxies API requests with SSE streaming.
Supports Anthropic Direct and OpenRouter providers.
No external dependencies — stdlib only.
"""

import http.server
import socket
import socketserver
import json
import os
import ssl
import urllib.request
import urllib.error

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PORT", 3000))
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


class CompanionHandler(http.server.SimpleHTTPRequestHandler):
    """Handles static files + API proxy."""

    def do_GET(self):
        """Handle GET — health check + static files."""
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"ok")
            return
        super().do_GET()

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/chat":
            self._handle_chat()
        elif self.path == "/api/test":
            self._handle_test()
        else:
            self.send_error(404, "Not found")

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        return json.loads(body)

    def _handle_test(self):
        """Test API connection with a minimal request."""
        try:
            data = self._read_json_body()
            api_key = data.get("apiKey", "")
            model = data.get("model", "claude-sonnet-4-20250514")
            provider = data.get("provider", "anthropic")

            if not api_key:
                self._send_json_error(400, "API key is required")
                return

            ctx = ssl.create_default_context()

            if provider == "openrouter":
                # OpenRouter — OpenAI-compatible format
                payload = json.dumps({
                    "model": model,
                    "max_tokens": 50,
                    "messages": [{"role": "user", "content": "Say 'Connection successful.' and nothing else."}]
                }).encode("utf-8")

                req = urllib.request.Request(
                    OPENROUTER_API_URL,
                    data=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}",
                    },
                    method="POST",
                )

                with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                    result = json.loads(resp.read())
                    text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    self._send_json({"status": "ok", "message": text, "model": model})
            else:
                # Anthropic Direct — native format
                payload = json.dumps({
                    "model": model,
                    "max_tokens": 50,
                    "messages": [{"role": "user", "content": "Say 'Connection successful.' and nothing else."}]
                }).encode("utf-8")

                req = urllib.request.Request(
                    ANTHROPIC_API_URL,
                    data=payload,
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                    },
                    method="POST",
                )

                with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                    result = json.loads(resp.read())
                    text = result.get("content", [{}])[0].get("text", "")
                    self._send_json({"status": "ok", "message": text, "model": model})

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            try:
                error_json = json.loads(error_body)
                msg = error_json.get("error", {}).get("message", error_body)
            except Exception:
                msg = error_body
            self._send_json_error(e.code, msg)
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_chat(self):
        """Proxy chat request to API with SSE streaming. Supports Anthropic + OpenRouter."""
        try:
            data = self._read_json_body()
            api_key = data.get("apiKey", "")
            model = data.get("model", "claude-sonnet-4-20250514")
            provider = data.get("provider", "anthropic")
            messages = data.get("messages", [])
            system_prompt = data.get("systemPrompt", "")
            max_tokens = data.get("maxTokens", 4096)

            if not api_key:
                self._send_json_error(400, "API key is required")
                return

            if not messages:
                self._send_json_error(400, "Messages are required")
                return

            ctx = ssl.create_default_context()

            if provider == "openrouter":
                # OpenRouter — OpenAI-compatible format
                # System prompt goes as first message in the array
                api_messages = []
                if system_prompt:
                    api_messages.append({"role": "system", "content": system_prompt})
                api_messages.extend(messages)

                api_payload = {
                    "model": model,
                    "max_tokens": max_tokens,
                    "stream": True,
                    "messages": api_messages,
                }
                payload_bytes = json.dumps(api_payload).encode("utf-8")

                req = urllib.request.Request(
                    OPENROUTER_API_URL,
                    data=payload_bytes,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}",
                        "Accept": "text/event-stream",
                    },
                    method="POST",
                )
            else:
                # Anthropic Direct — native format
                api_payload = {
                    "model": model,
                    "max_tokens": max_tokens,
                    "stream": True,
                    "messages": messages,
                }
                if system_prompt:
                    api_payload["system"] = system_prompt

                payload_bytes = json.dumps(api_payload).encode("utf-8")

                req = urllib.request.Request(
                    ANTHROPIC_API_URL,
                    data=payload_bytes,
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "Accept": "text/event-stream",
                    },
                    method="POST",
                )

            # Stream the response back as SSE
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "close")
            self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
            self.end_headers()

            try:
                with urllib.request.urlopen(req, context=ctx, timeout=120) as resp:
                    buffer = b""
                    stream_done = False
                    while True:
                        chunk = resp.read(1)
                        if not chunk:
                            break
                        buffer += chunk
                        # Process complete lines
                        while b"\n" in buffer:
                            line, buffer = buffer.split(b"\n", 1)
                            line_str = line.decode("utf-8", errors="replace").strip()
                            if line_str:
                                if provider == "openrouter" and line_str.startswith("data: "):
                                    # Check for stream end before translating
                                    if line_str.strip() == "data: [DONE]":
                                        stream_done = True
                                    # Translate OpenRouter SSE → Anthropic SSE format
                                    translated = self._translate_openrouter_sse(line_str)
                                    if translated:
                                        self.wfile.write(f"{translated}\n".encode("utf-8"))
                                else:
                                    # Anthropic: forward SSE event lines as-is
                                    self.wfile.write(f"{line_str}\n".encode("utf-8"))
                            else:
                                # Empty line = end of SSE event, forward it
                                self.wfile.write(b"\n")
                            self.wfile.flush()
                        # Break after [DONE] to avoid blocking on read
                        if stream_done:
                            # Ensure final SSE event is properly terminated
                            self.wfile.write(b"\n\n")
                            self.wfile.flush()
                            break

                    # Flush remaining buffer
                    if buffer:
                        self.wfile.write(buffer)
                        self.wfile.write(b"\n\n")
                        self.wfile.flush()

            except urllib.error.HTTPError as e:
                error_body = e.read().decode("utf-8", errors="replace")
                error_event = f"data: {json.dumps({'type': 'error', 'error': {'message': error_body}})}\n\n"
                self.wfile.write(error_event.encode("utf-8"))
                self.wfile.flush()

        except Exception as e:
            try:
                error_event = f"data: {json.dumps({'type': 'error', 'error': {'message': str(e)}})}\n\n"
                self.wfile.write(error_event.encode("utf-8"))
                self.wfile.flush()
            except Exception:
                pass

    def _translate_openrouter_sse(self, line_str):
        """Translate an OpenRouter SSE data line to Anthropic SSE format.

        OpenRouter emits: data: {"choices":[{"delta":{"content":"text"}}]}
        We translate to: data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"text"}}
        """
        raw = line_str[6:].strip()  # strip "data: " prefix
        if raw == "[DONE]":
            return 'data: {"type":"message_stop"}'
        try:
            event = json.loads(raw)
            choices = event.get("choices", [])
            if not choices:
                return None
            delta = choices[0].get("delta", {})
            content = delta.get("content")
            if content is not None:
                translated = {
                    "type": "content_block_delta",
                    "delta": {"type": "text_delta", "text": content}
                }
                return f"data: {json.dumps(translated)}"
            # Check for error in the event
            if "error" in event:
                err = {"type": "error", "error": {"message": str(event["error"])}}
                return f"data: {json.dumps(err)}"
            return None
        except (json.JSONDecodeError, KeyError, IndexError):
            return None

    def _send_json(self, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _send_json_error(self, code, message):
        body = json.dumps({"status": "error", "message": message}).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        """Suppress default request logging for cleaner output."""
        if "/api/" in (args[0] if args else ""):
            print(f"[API] {args[0]}")


class ReusableTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    host = "0.0.0.0"
    with ReusableTCPServer((host, PORT), CompanionHandler) as httpd:
        print(f"\n  D&D Companion — Server Ready")
        print(f"  Listening on {host}:{PORT}")
        print(f"  Static files + Claude API proxy\n", flush=True)
        httpd.serve_forever()
