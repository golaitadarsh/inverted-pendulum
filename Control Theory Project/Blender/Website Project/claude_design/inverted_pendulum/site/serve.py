#!/usr/bin/env python3
"""Dev server with sane caching: HTML/CSS/JS never cached (no-store), the
versioned GLB cached forever. Replaces `python3 -m http.server 8765` so a
stale index.html can never hide edits again.

Usage:  python3 serve.py  [port]   (default 8765)
"""
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.split('?')[0].endswith(('.html', '.css', '.js', '/')):
            self.send_header('Cache-Control', 'no-store')
        else:
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f'serving on http://localhost:{port}  (html/css/js: no-store)')
    HTTPServer(('', port), NoCacheHandler).serve_forever()
