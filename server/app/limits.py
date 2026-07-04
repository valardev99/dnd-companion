"""Shared rate limiter — lives in its own module to avoid circular imports.

NOTE: on Railway the app sits behind a proxy. uvicorn must run with
--proxy-headers --forwarded-allow-ips="*" (or set FORWARDED_ALLOW_IPS)
so get_remote_address sees the real client IP, not the proxy's — otherwise
every user shares one rate-limit bucket.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
