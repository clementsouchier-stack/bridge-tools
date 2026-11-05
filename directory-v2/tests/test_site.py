#!/usr/bin/env python3
"""Offline smoke/security/SEO tests. Standard-library test runner."""
from __future__ import annotations
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from urllib.parse import urlparse
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT
sys.path.insert(0,str(ROOT/'scripts'))
from build import builder

class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages=sorted(SITE.glob('*.html'))
        cls.records=json.loads((ROOT/'content/labels.json').read_text())
    def test_page_inventory(self):
        self.assertEqual(len(self.pages),13)
        self.assertTrue((SITE/'label-franker.html').exists())
        self.assertTrue((SITE/'for-techno.html').exists())
    def test_valid_semantics_metadata_and_noindex(self):
        titles=[]
        for p in self.pages:
            soup=BeautifulSoup(p.read_text(),'html.parser')
            self.assertEqual(len(soup.select('h1')),1,p.name)
            self.assertEqual(len(soup.select('main#main')),1,p.name)
            self.assertEqual(len(soup.select('title')),1,p.name)
            self.assertEqual(len(soup.select('meta[name="description"]')),1,p.name)
            self.assertTrue(soup.select_one('meta[property="og:title"]'),p.name)
            self.assertEqual(soup.select_one('meta[name="robots"]')['content'],'noindex,nofollow',p.name)
            self.assertFalse(soup.select('link[rel="canonical"]'),p.name)
            self.assertFalse(soup.select('script[type="application/ld+json"]'),p.name)
            self.assertTrue(soup.select('a.skip[href="#main"]'),p.name)
            self.assertFalse(soup.select('a[href^="#/"]'),p.name)
            ids=[node.get('id') for node in soup.select('[id]')]
            self.assertEqual(len(ids),len(set(ids)),p.name)
            titles.append(soup.title.get_text())
            for img in soup.select('img'):
                self.assertIn('alt',img.attrs,p.name)
                self.assertTrue((SITE/img['src']).is_file(),f'{p.name}: image {img["src"]} missing')
            for anchor in soup.select('a[href]'):
                href=anchor['href']
                if href.startswith(('https://','#','mailto:','tel:')):continue
                self.assertNotIn('javascript:',href)
                target=(SITE/href.split('?')[0].split('#')[0])
                self.assertTrue(target.is_file(),f'{p.name}: broken local link to {href}')
        self.assertEqual(len(titles),len(set(titles)),'Titles must be unique')
    def test_logo_is_valid_svg(self):
        p=SITE/'assets/bridge-logo.svg'
        self.assertTrue(p.read_bytes().lstrip().startswith(b'<svg'))
        self.assertFalse((SITE/'assets/bridge-logo.webp').exists())
    def test_existing_inbox_urls_are_exact(self):
        for k,url in [('walboomers','https://inbox.bridge.audio/walboomers-music'),('beggars','https://inbox.bridge.audio/beggars-jFUZev')]:
            soup=BeautifulSoup((SITE/f'label-{k}.html').read_text(),'html.parser')
            buttons=soup.select('.action a.btn[href]')
            self.assertEqual(len(buttons),1)
            self.assertEqual(buttons[0]['href'],url)
            self.assertEqual(buttons[0].get('target'),'_blank')
            self.assertIn('noopener',buttons[0]['rel'])
        for k in ('delsin','universal','sony'):
            page=(SITE/f'label-{k}.html').read_text()
            self.assertIn('Not available for this label',page)
            self.assertNotIn('https://inbox.bridge.audio/',page)
    def test_no_illustrative_labels_in_public_listing(self):
        home=(SITE/'index.html').read_text();listing=(SITE/'labels.html').read_text()
        for name in ('Headbanger Records','Franker'):
            self.assertNotIn(name,home)
            self.assertNotIn(name,listing)
    def test_no_private_data_signatures(self):
        patterns=[r'AKIA[0-9A-Z]{16}',r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY',
                  r'(?i)sk_(?:live|test)_[A-Za-z0-9]{12,}',r'(?i)(?:xoxb|xoxp)-[A-Za-z0-9-]{15,}',
                  r'(?i)X-Amz-(?:Signature|Credential)=',r'(?i)(?:api[_-]?key|client_secret)\s*[:=]\s*["\'][a-zA-Z0-9_-]{16,}']
        for p in ROOT.rglob('*'):
            if not p.is_file() or p.suffix.lower() not in ('.html','.js','.css','.json','.svg','.txt'):continue
            body=p.read_text(errors='replace')
            for pattern in patterns:
                self.assertIsNone(re.search(pattern,body),f'Secret-like content: {p.name}')
    def test_js_syntax(self):
        result=subprocess.run(['node','--check',str(SITE/'assets/app.js')],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr)
    def test_production_fail_closed(self):
        with self.assertRaises(ValueError):
            with tempfile.TemporaryDirectory() as folder:
                builder('production',self.records,folder,'https://www.bridge.audio')
    def test_production_build_metadata_and_sitemap(self):
        approved=[]
        for r in self.records:
            if r.get('visible'):
                copy=dict(r,release_approved=True,submission_verified=bool(r.get('submission_url')))
                approved.append(copy)
        with tempfile.TemporaryDirectory() as folder:
            out=Path(folder)
            builder('production',approved,out,'https://www.bridge.audio',publish_categories=False)
            self.assertFalse((out/'in/amsterdam/index.html').exists(),'Never overwrite legacy category pages with partial data')
            self.assertTrue((out/'walboomers-music_w6qykr/index.html').exists())
            soup=BeautifulSoup((out/'walboomers-music_w6qykr/index.html').read_text(),'html.parser')
            canonical=soup.select_one('link[rel="canonical"]')
            self.assertEqual(canonical['href'],'https://www.bridge.audio/directory/record-label/walboomers-music_w6qykr/')
            self.assertEqual(soup.select_one('meta[name="robots"]')['content'],'index,follow,max-image-preview:large')
            info=json.loads(soup.select_one('script[type="application/ld+json"]').string)
            graph=info['@graph'];self.assertTrue(any(x['@type']=='BreadcrumbList' for x in graph))
            self.assertTrue(any(x['@type']=='Organization' for x in graph))
            self.assertTrue((out/'sitemap.xml').exists())
            ET.parse(out/'sitemap.xml')
            self.assertTrue((out/'robots.sample.txt').exists())
            self.assertFalse((out/'robots.txt').exists(),'Production root robots requires host integration')

if __name__=='__main__':unittest.main(verbosity=2)
