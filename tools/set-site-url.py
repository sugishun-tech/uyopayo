#!/usr/bin/env python3
from pathlib import Path
import argparse, re
parser = argparse.ArgumentParser(description="Set absolute og:url values for GitHub Pages.")
parser.add_argument("--url", dest="url", help="Example: https://yourname.github.io/uyopayo-diagnosis")
parser.add_argument("--site-url", dest="url", help="Alias of --url")
args = parser.parse_args()
if not args.url:
    parser.error("--site-url or --url is required")
base = args.url.rstrip('/') + '/'
root = Path(__file__).resolve().parents[1]
tag_re = re.compile(r'(<meta\s+[^>]*?property="og:url"[^>]*?content=")([^"]*)("[^>]*?data-og-path="([^"]*)"[^>]*?>)')
count = 0
for path in root.rglob('*.html'):
    text = path.read_text(encoding='utf-8')
    new, n = tag_re.subn(lambda m: m.group(1) + base + m.group(4).lstrip('/') + m.group(3), text)
    if n:
        path.write_text(new, encoding='utf-8')
        count += n
print(f"Updated {count} og:url meta tags under {root}")
