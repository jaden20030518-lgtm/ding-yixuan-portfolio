#!/usr/bin/env python3
"""Structural + local-server checks for the portfolio site (shipped with site)."""
from __future__ import annotations

import re
import sys
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

ROOT = Path(__file__).resolve().parent
REQUIRED_STRINGS = [
    "丁一璇",
    "中国美术学院",
    "独立剪辑",
    "中英双语字幕",
    "AI",
]
VIDEO_RELS = [
    "videos/01_caa_ai_montage.mp4",
    "videos/02_caa_bilingual_subs.mp4",
    "videos/03_work_940.mp4",
    "videos/04_caa_raw_long.mp4",
]


def check_files() -> list[str]:
    errs: list[str] = []
    html = ROOT / "index.html"
    if not html.is_file():
        errs.append("missing index.html")
        return errs
    body = html.read_text(encoding="utf-8")
    for s in REQUIRED_STRINGS:
        if s not in body:
            errs.append(f"index.html missing string: {s}")
    for rel in VIDEO_RELS:
        if rel not in body:
            errs.append(f"index.html missing video ref: {rel}")
        p = ROOT / rel
        if not p.is_file():
            errs.append(f"missing media file: {rel}")
        else:
            size = p.stat().st_size
            if size < 1_000_000:
                errs.append(f"{rel} too small: {size}")
            if size > 100 * 1024 * 1024:
                errs.append(f"{rel} too large: {size}")
    # section headings
    if not re.search(r"作品\s*01", body):
        errs.append("missing 作品 01 heading")
    if not re.search(r"作品\s*02", body):
        errs.append("missing 作品 02 heading")
    return errs


def fetch(url: str) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": "portfolio-verify/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.status, resp.read()


def check_local_server() -> list[str]:
    errs: list[str] = []

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT), **kwargs)

        def log_message(self, format, *args):  # noqa: A003
            return

    httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    port = httpd.server_address[1]
    t = Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    base = f"http://127.0.0.1:{port}"
    try:
        for i in range(2):
            status, body = fetch(f"{base}/")
            if status != 200:
                errs.append(f"GET / attempt {i+1} status {status}")
            text = body.decode("utf-8", errors="replace")
            if "丁一璇" not in text or "中国美术学院" not in text:
                errs.append(f"GET / attempt {i+1} missing key strings")
            if not body:
                errs.append(f"GET / attempt {i+1} empty body")
        for rel in VIDEO_RELS:
            status, body = fetch(f"{base}/{rel}")
            if status != 200:
                errs.append(f"GET {rel} status {status}")
            if len(body) < 1_000_000:
                errs.append(f"GET {rel} body too small: {len(body)}")
    finally:
        httpd.shutdown()
    return errs


def main() -> int:
    errs = check_files() + check_local_server()
    if errs:
        print("FAIL")
        for e in errs:
            print(" -", e)
        return 1
    print("PASS: structure + local static server + videos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
