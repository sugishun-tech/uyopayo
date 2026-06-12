#!/usr/bin/env python3
"""Refresh canonical /results/ from /result/.

The project is intentionally text-only: no generated characters, no 4-koma, no image assets.
"""
from pathlib import Path
import shutil
ROOT = Path(__file__).resolve().parents[1]
src = ROOT / "result"
dst = ROOT / "results"
if src.exists():
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    for p in dst.glob('*/index.html'):
        slug = p.parent.name
        text = p.read_text(encoding='utf-8')
        text = text.replace(f'data-og-path="result/{slug}/"', f'data-og-path="results/{slug}/"')
        p.write_text(text, encoding='utf-8')
print("Post-build complete: /results/ refreshed. Text-only build, no images generated.")
