#!/usr/bin/env python3
"""Visual and interaction QA without network navigation (sandbox-safe)."""
from __future__ import annotations
from bs4 import BeautifulSoup
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64, json, mimetypes, sys
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT;OUT=ROOT/'qa';OUT.mkdir(exist_ok=True)
CSS=(SITE/'assets/styles.css').read_text()
JS=(SITE/'assets/app.js').read_text()

def inline(name):
    soup=BeautifulSoup((SITE/name).read_text(),'html.parser')
    for link in list(soup.find_all('link')):
        if link.get('rel')==['stylesheet'] or 'preconnect' in link.get('rel',[]):
            if link.get('href')=='assets/styles.css':
                tag=soup.new_tag('style');tag.string=CSS;link.replace_with(tag)
            else:link.decompose()
    for script in list(soup.find_all('script',src=True)):
        if script.get('src')=='assets/app.js':
            script.attrs.pop('src',None);script.attrs.pop('defer',None);script.string=JS;script.extract();soup.body.append(script)
    for tag in soup.find_all('img',src=True):
        p=SITE/tag['src']
        if p.exists():
            mime=mimetypes.guess_type(str(p))[0] or 'application/octet-stream'
            tag['src']=f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode()
    return str(soup)

def run():
    cases=[('index.html','home'),('labels.html','listing'),('label-walboomers.html','walboomers'),('label-beggars.html','beggars'),('label-delsin.html','delsin'),('in-amsterdam.html','amsterdam')]
    results=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
        for filename,name in cases:
            for width,height in [(1440,900),(768,950),(390,844),(375,812)]:
                page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='reduce')
                console=[]
                page.on('pageerror',lambda exc: console.append(str(exc)))
                page.set_content(inline(filename),wait_until='domcontentloaded',timeout=15000)
                page.wait_for_timeout(70)
                metrics=page.evaluate('''() => ({scrollWidth: document.documentElement.scrollWidth,clientWidth:innerWidth,bodyHeight:document.body.scrollHeight,imgs:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.alt),h1:document.querySelectorAll('h1').length})''')
                if width in (1440,390):page.screenshot(path=str(OUT/f'{name}-{width}.png'),full_page=True)
                results.append({'page':filename,'width':width,**metrics,'errors':console})
                page.close()
        page=browser.new_page(viewport={'width':1024,'height':800})
        page.set_content(inline('labels.html'),wait_until='domcontentloaded')
        assert page.locator('#label-cards [data-card]:visible').count()==5
        page.locator('#location-filter').select_option('Amsterdam')
        assert page.locator('#label-cards [data-card]:visible').count()==2
        page.locator('#only-bridge').check()
        assert page.locator('#label-cards [data-card]:visible').count()==1
        assert 'Walboomers' in page.locator('#label-cards [data-card]:visible').first.inner_text()
        page.locator('#reset-filters').click()
        assert page.locator('#label-cards [data-card]:visible').count()==5
        page.locator('#filter').fill('zzz999')
        assert page.locator('#empty-results').is_visible()
        page.locator('#empty-reset').click()
        assert page.locator('#label-cards [data-card]:visible').count()==5
        page.locator('#sort').select_option('az')
        assert 'Beggars' in page.locator('#label-cards [data-card]:visible').first.inner_text()
        page.close();browser.close()
    (OUT/'visual-audit.json').write_text(json.dumps(results,indent=2))
    fails=[r for r in results if r['scrollWidth']>r['clientWidth']+1 or r['imgs'] or r['errors'] or r['h1']!=1]
    print('Visual sizes',len(results),'Failures',len(fails))
    for x in fails:print(x)
    if fails:sys.exit(1)
if __name__=='__main__':run()
