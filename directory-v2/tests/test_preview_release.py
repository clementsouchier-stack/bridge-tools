#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
P=Path(__file__).resolve().parents[1]
for path in P.glob('*.html'):
    soup=BeautifulSoup(path.read_text(), 'html.parser')
    assert soup.select_one('main#main'), path
    assert soup.select_one('meta[name="robots"][content="noindex,nofollow"]'), path
    assert not soup.select('link[rel="canonical"]'), path
    for link in soup.select('a[href]'):
        h=link['href'].split('#')[0].split('?')[0]
        if not h or h.startswith(('http://','https://','mailto:','tel:')): continue
        assert (P/h).is_file(), (path, h)
print('GitHub Pages preview safety and internal links: OK')
