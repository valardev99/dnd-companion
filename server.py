#!/usr/bin/env python3
"""
D&D Companion App — API Proxy Server
Serves static files AND proxies API requests with SSE streaming.
Uses OpenRouter as the LLM provider.
Includes PostgreSQL persistence for game saves.
"""

import http.server
import socket
import socketserver
import json
import os
import re
import ssl
import urllib.request
import urllib.error
from datetime import datetime, timezone

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PORT", 3000))
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
DATABASE_URL = os.environ.get("DATABASE_URL", "")


# ═══════════════════════════════════════════════════════════════
# DATABASE HELPERS
# ═══════════════════════════════════════════════════════════════

def get_db():
    """Get a new database connection. Caller must close it."""
    import psycopg2
    import psycopg2.extras
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    return conn


def init_db():
    """Create the game_saves table if it doesn't exist."""
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS game_saves (
                id SERIAL PRIMARY KEY,
                save_name TEXT NOT NULL DEFAULT 'autosave',
                game_data JSONB NOT NULL DEFAULT '{}',
                chat_messages JSONB NOT NULL DEFAULT '[]',
                world_bible TEXT DEFAULT '',
                api_model TEXT DEFAULT 'claude-sonnet-4-20250514',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        cur.close()
    finally:
        conn.close()


def _serialize_dt(dt):
    """Convert a datetime to ISO format string."""
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt) if dt else None


class CompanionHandler(http.server.SimpleHTTPRequestHandler):
    """Handles static files + API proxy + save/load endpoints."""

    def do_GET(self):
        """Handle GET — health check, saves API, + static files."""
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"ok")
            return

        # Save endpoints
        if self.path == "/api/saves":
            self._handle_list_saves()
            return

        save_match = re.match(r'^/api/saves/(\d+)$', self.path)
        if save_match:
            self._handle_load_save(int(save_match.group(1)))
            return

        super().do_GET()

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/chat":
            self._handle_chat()
        elif self.path == "/api/test":
            self._handle_test()
        elif self.path == "/api/saves":
            self._handle_create_save()
        else:
            self.send_error(404, "Not found")

    def do_PUT(self):
        save_match = re.match(r'^/api/saves/(\d+)$', self.path)
        if save_match:
            self._handle_update_save(int(save_match.group(1)))
        else:
            self.send_error(404, "Not found")

    def do_DELETE(self):
        save_match = re.match(r'^/api/saves/(\d+)$', self.path)
        if save_match:
            self._handle_delete_save(int(save_match.group(1)))
        else:
            self.send_error(404, "Not found")

    # ─── Save/Load Handlers ───

    def _handle_list_saves(self):
        """List all saves with summary info."""
        if not DATABASE_URL:
            self._send_json_error(503, "Database not configured")
            return
        try:
            import psycopg2.extras
            conn = get_db()
            try:
                cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cur.execute("""
                    SELECT id, save_name, updated_at,
                           game_data->'campaign'->>'name' AS campaign_name
                    FROM game_saves
                    ORDER BY updated_at DESC
                """)
                rows = cur.fetchall()
                cur.close()
                saves = []
                for row in rows:
                    saves.append({
                        "id": row["id"],
                        "save_name": row["save_name"],
                        "updated_at": _serialize_dt(row["updated_at"]),
                        "campaign_name": row["campaign_name"],
                    })
                self._send_json(saves)
            finally:
                conn.close()
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_load_save(self, save_id):
        """Load a specific save by ID."""
        if not DATABASE_URL:
            self._send_json_error(503, "Database not configured")
            return
        try:
            import psycopg2.extras
            conn = get_db()
            try:
                cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cur.execute("""
                    SELECT id, save_name, game_data, chat_messages, world_bible, api_model
                    FROM game_saves WHERE id = %s
                """, (save_id,))
                row = cur.fetchone()
                cur.close()
                if not row:
                    self._send_json_error(404, "Save not found")
                    return
                self._send_json({
                    "id": row["id"],
                    "save_name": row["save_name"],
                    "game_data": row["game_data"],
                    "chat_messages": row["chat_messages"],
                    "world_bible": row["world_bible"],
                    "api_model": row["api_model"],
                })
            finally:
                conn.close()
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_create_save(self):
        """Create a new save."""
        if not DATABASE_URL:
            self._send_json_error(503, "Database not configured")
            return
        try:
            import psycopg2.extras
            data = self._read_json_body()
            conn = get_db()
            try:
                cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cur.execute("""
                    INSERT INTO game_saves (save_name, game_data, chat_messages, world_bible, api_model)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, save_name, created_at
                """, (
                    data.get("save_name", "autosave"),
                    json.dumps(data.get("game_data", {})),
                    json.dumps(data.get("chat_messages", [])),
                    data.get("world_bible", ""),
                    data.get("api_model", "claude-sonnet-4-20250514"),
                ))
                row = cur.fetchone()
                cur.close()
                self._send_json({
                    "id": row["id"],
                    "save_name": row["save_name"],
                    "created_at": _serialize_dt(row["created_at"]),
                })
            finally:
                conn.close()
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_update_save(self, save_id):
        """Update an existing save (autosave)."""
        if not DATABASE_URL:
            self._send_json_error(503, "Database not configured")
            return
        try:
            import psycopg2.extras
            data = self._read_json_body()
            conn = get_db()
            try:
                cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cur.execute("""
                    UPDATE game_saves
                    SET game_data = %s,
                        chat_messages = %s,
                        world_bible = %s,
                        api_model = %s,
                        save_name = COALESCE(%s, save_name),
                        updated_at = NOW()
                    WHERE id = %s
                    RETURNING id, updated_at
                """, (
                    json.dumps(data.get("game_data", {})),
                    json.dumps(data.get("chat_messages", [])),
                    data.get("world_bible", ""),
                    data.get("api_model", "claude-sonnet-4-20250514"),
                    data.get("save_name"),
                    save_id,
                ))
                row = cur.fetchone()
                cur.close()
                if not row:
                    self._send_json_error(404, "Save not found")
                    return
                self._send_json({
                    "id": row["id"],
                    "updated_at": _serialize_dt(row["updated_at"]),
                })
            finally:
                conn.close()
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_delete_save(self, save_id):
        """Delete a save."""
        if not DATABASE_URL:
            self._send_json_error(503, "Database not configured")
            return
        try:
            conn = get_db()
            try:
                cur = conn.cursor()
                cur.execute("DELETE FROM game_saves WHERE id = %s", (save_id,))
                cur.close()
                self._send_json({"status": "ok"})
            finally:
                conn.close()
        except Exception as e:
            self._send_json_error(500, str(e))

    # ─── Existing Handlers ───

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        return json.loads(body)

    def _handle_test(self):
        """Test API connection with a minimal request."""
        try:
            data = self._read_json_body()
            api_key = data.get("apiKey", "")
            model = data.get("model", "google/gemini-3-flash-preview")

            if not api_key:
                self._send_json_error(400, "API key is required")
                return

            ctx = ssl.create_default_context()

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
        """Proxy chat request to OpenRouter API with SSE streaming."""
        try:
            data = self._read_json_body()
            api_key = data.get("apiKey", "")
            model = data.get("model", "google/gemini-3-flash-preview")
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

            # Stream the response back as SSE (translated to Anthropic format for client)
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
                                if line_str.startswith("data: "):
                                    # Check for stream end before translating
                                    if line_str.strip() == "data: [DONE]":
                                        stream_done = True
                                    # Translate OpenRouter SSE → client SSE format
                                    translated = self._translate_openrouter_sse(line_str)
                                    if translated:
                                        self.wfile.write(f"{translated}\n".encode("utf-8"))
                                else:
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
        """Translate an OpenRouter SSE data line to client SSE format.

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
    # Initialize database if DATABASE_URL is present
    if DATABASE_URL:
        try:
            init_db()
            print("  [DB] PostgreSQL connected, game_saves table ready")
        except Exception as e:
            print(f"  [DB] Warning: Could not initialize database: {e}")
            print("  [DB] Save/load endpoints will return errors")
    else:
        print("  [DB] No DATABASE_URL set — save/load disabled, using localStorage only")

    host = "0.0.0.0"
    with ReusableTCPServer((host, PORT), CompanionHandler) as httpd:
        print(f"\n  D&D Companion — Server Ready")
        print(f"  Listening on {host}:{PORT}")
        print(f"  Static files + OpenRouter API proxy\n", flush=True)
        httpd.serve_forever()
