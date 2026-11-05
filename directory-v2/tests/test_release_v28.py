"""V28 regression tests for fail-closed publishing, safe links and page semantics."""
from __future__ import annotations
import copy
from datetime import date, timedelta
import json
from pathlib import Path
import sys
import tempfile
import unittest
from urllib.parse import urlparse
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT
sys.path.insert(0,str(ROOT/'scripts'))
from build import BASE_DIR, builder, check_data


class ReleaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows=json.loads((ROOT/'content/labels.json').read_text())

    def approved(self):
        return [dict(r,release_approved=True,submission_verified=bool(r.get('submission_url')),
                     checked_at=date.today().isoformat()) for r in self.rows if r.get('visible')]

    def production_site(self,folder,rows=None,**kw):
        return builder('production',rows if rows is not None else self.approved(),folder,'https://www.bridge.audio',**kw)

    def test_no_preview_pages_claim_to_be_production(self):
        for p in SITE.glob('*.html'):
            soup=BeautifulSoup(p.read_text(),'html.parser')
            self.assertEqual(soup.select_one('meta[name=robots]')['content'],'noindex,nofollow',p)
            self.assertFalse(soup.select('link[rel=canonical]'),p)
            self.assertTrue(soup.select_one('main#main'),p)

    def test_submission_action_precedes_main_in_keyboard_order(self):
        for key in ('walboomers','beggars','delsin','universal','sony'):
            soup=BeautifulSoup((SITE/f'label-{key}.html').read_text(),'html.parser')
            action=soup.select_one('aside.action')
            self.assertIsNotNone(action,key)
            self.assertLess(list(soup.body.children).index(action),list(soup.body.children).index(soup.select_one("main#main")),key)
            if key in ('walboomers','beggars'):
                link=action.select_one('a.btn')
                self.assertIn(key.capitalize().split('-')[0],link['aria-label'])
                self.assertIn('inbox.bridge.audio',link['href'])
            else:
                self.assertIsNone(action.select_one('a.btn'))

    def test_status_and_destination_are_distinct_fields(self):
        on_bridge=[r for r in self.rows if r['status']=='on_bridge']
        self.assertTrue(on_bridge)
        for r in on_bridge:
            self.assertTrue(r['submission_url'].startswith('https://inbox.bridge.audio/'))

    def test_no_preview_category_points_to_empty_listing(self):
        index=BeautifulSoup((SITE/'index.html').read_text(),'html.parser')
        for a in index.select('a.explore-tile'):
            path=SITE/a['href']
            self.assertTrue(path.is_file(),a['href'])
            dest=BeautifulSoup(path.read_text(),'html.parser')
            self.assertTrue(dest.select('a.card'),a['href'])

    def test_production_origin_must_not_have_query_or_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            for origin in ('https://www.bridge.audio?utm=test','https://www.bridge.audio/path','http://www.bridge.audio'):
                with self.subTest(origin=origin),self.assertRaisesRegex(ValueError,'trusted HTTPS origin'):
                    builder('production',self.approved(),tmp,origin)

    def test_untrusted_inbox_rejected(self):
        rows=self.approved();rows[0]['submission_url']='https://example.org/track'
        with self.assertRaisesRegex(ValueError,'Untrusted Bridge Inbox'):
            check_data(rows,True)

    def test_unsafe_slug_and_key_rejected_before_build(self):
        for field,value in [('slug','../../private'),('key','../evil'),('slug','javascript:alert(1)'),('key','a/b')]:
            rows=self.approved();rows[0][field]=value
            with self.subTest(field=field,value=value),self.assertRaisesRegex(ValueError,'Unsafe key or slug'):
                check_data(rows,True)

    def test_logo_path_and_missing_asset_rejected(self):
        for logo in ('../../private.svg','label-nonexistent.png','https://example.org/asset.png'):
            rows=self.approved();rows[0]['logo']=logo
            with self.subTest(logo=logo),self.assertRaises(ValueError):check_data(rows,True)

    def test_stale_future_invalid_source_date_blocked(self):
        for value in ['2023-02-12',(date.today()+timedelta(days=1)).isoformat(),'not-a-date']:
            rows=self.approved();rows[0]['checked_at']=value
            with self.subTest(value=value),self.assertRaises(ValueError):check_data(rows,True)

    def test_production_home_never_links_to_unreleased_categories(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.production_site(tmp)
            soup=BeautifulSoup((Path(tmp)/'index.html').read_text(),'html.parser')
            self.assertFalse(soup.select('.explore-tile'))
            self.assertNotIn('/directory/record-label/in/amsterdam/',soup.prettify())
            self.assertFalse((Path(tmp)/'in/amsterdam/index.html').exists())

    def test_production_internal_links_resolve_to_generated_documents(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.production_site(tmp)
            out=Path(tmp)
            for page in out.rglob('*.html'):
                soup=BeautifulSoup(page.read_text(),'html.parser')
                for a in soup.select('a[href]')+soup.select('link[rel=stylesheet]'):
                    href=a.get('href')
                    if not href or href.startswith('#') or href.startswith('https://'):
                        continue
                    self.assertTrue(href.startswith(BASE_DIR+'/'),(page,href))
                    path=href[len(BASE_DIR):].split('?')[0]
                    rel=path.lstrip('/')
                    target=out/rel
                    if path.endswith('/'):
                        target=target/'index.html'
                    self.assertTrue(target.is_file(),f'{page.name} -> {href}')

    def test_production_build_refuses_dirty_output_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp)/'leftover.html').write_text('old page')
            with self.assertRaisesRegex(ValueError,'must be empty'):
                self.production_site(tmp)

    def test_core_button_and_status_contrast(self):
        from math import isfinite
        def luminance(code):
            values=[int(code[i:i+2],16)/255 for i in (1,3,5)]
            linear=[v/12.92 if v<=0.04045 else ((v+.055)/1.055)**2.4 for v in values]
            return sum(x*w for x,w in zip(linear,(0.2126,0.7152,0.0722)))
        def ratio(a,b):
            aa,bb=luminance(a),luminance(b)
            return (max(aa,bb)+.05)/(min(aa,bb)+.05)
        for fg,bg in (('#ffffff','#2f43de'),('#2b3ec2','#f2f4ff'),('#5d6171','#f1f2f5'),('#727581','#ffffff')):
            with self.subTest(colors=(fg,bg)):
                self.assertGreaterEqual(ratio(fg,bg),4.5)
        self.assertGreaterEqual(ratio('#8e93a4','#ffffff'),3,'Form control borders need non-text contrast')

    def test_404_is_noindex_without_home_canonical(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.production_site(tmp)
            soup=BeautifulSoup((Path(tmp)/'404.html').read_text(),'html.parser')
            self.assertEqual(soup.select_one('meta[name=robots]')['content'],'noindex,nofollow')
            self.assertFalse(soup.select('link[rel=canonical]'))
            self.assertFalse(soup.select('meta[property="og:url"]'))

    def test_preview_logo_not_used_as_tiny_og_image(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.production_site(tmp)
            soup=BeautifulSoup((Path(tmp)/'walboomers-music_w6qykr/index.html').read_text(),'html.parser')
            self.assertFalse(soup.select('meta[property="og:image"]'))

    def test_editorial_categories_cannot_publish_without_review(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(ValueError,'approved editorial'):
                self.production_site(tmp,publish_categories=True)

    def test_editorial_categories_with_small_samples_not_generated(self):
        editorial={'location:amsterdam':{'release_approved':True,'checked_at':date.today().isoformat(),
                   'source_url':'https://www.bridge.audio/directory/record-label/',
                   'description':' '.join(['Verified editorial description for the category.']*22)}}
        with tempfile.TemporaryDirectory() as tmp:
            self.production_site(tmp,publish_categories=True,category_editorial=editorial)
            self.assertFalse((Path(tmp)/'in/amsterdam/index.html').exists(),
                             'Do not publish a thin 2-record category page')

    def test_editorial_category_with_3_profiles_and_review_generates(self):
        rows=self.approved()
        clone=dict(rows[0],key='qa-third-record',slug='qa-third-record_123',name='QA third record',
                   source_url='https://www.bridge.audio/directory/record-label/')
        rows.append(clone)
        editorial={'location:amsterdam':{'release_approved':True,'checked_at':date.today().isoformat(),
                   'source_url':'https://www.bridge.audio/directory/record-label/',
                   'description':' '.join(['A researched, independently reviewed description of Amsterdam labels.']*18)}}
        with tempfile.TemporaryDirectory() as tmp:
            self.production_site(tmp,rows,publish_categories=True,category_editorial=editorial)
            self.assertTrue((Path(tmp)/'in/amsterdam/index.html').is_file())
            soup=BeautifulSoup((Path(tmp)/'index.html').read_text(),'html.parser')
            self.assertTrue(soup.select_one('a[href="/directory/record-label/in/amsterdam/"]'))


if __name__=='__main__':unittest.main(verbosity=2)
