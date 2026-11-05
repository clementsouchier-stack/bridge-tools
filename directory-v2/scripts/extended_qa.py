#!/usr/bin/env python3
"""V28 browser QA on the real static files (no server or production access)."""
from __future__ import annotations
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from visual_qa import inline
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT;OUT=ROOT/'qa';OUT.mkdir(exist_ok=True)

sizes=[(320,700),(360,780),(375,812),(390,844),(430,932),(768,1024),(1024,768),(1440,900),(1920,1080)]
cases=['index.html','labels.html','label-walboomers.html','label-beggars.html','label-delsin.html','in-amsterdam.html']
results=[]

def inspect(page,name,w,h):
    return page.evaluate('''() => ({width:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,emptyImages:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src),h1:document.querySelectorAll('h1').length,links:[...document.querySelectorAll('a[href]')].length,main:!!document.querySelector('main#main'),hidden:!!document.querySelector('[hidden]')})''')

with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking'])
  for name in cases:
    for w,h in sizes:
      page=browser.new_page(viewport={'width':w,'height':h},reduced_motion='reduce')
      errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
      page.set_content(inline(name),wait_until='domcontentloaded',timeout=15000)
      metrics=inspect(page,name,w,h)
      metrics.update(page=name,height=h,errors=errors)
      if name in ['index.html','labels.html','label-walboomers.html'] and w in (320,390,768,1440):
        page.screenshot(path=str(OUT/f'v28-{name.replace(".html","")}-{w}.png'),full_page=True,timeout=12000)
      results.append(metrics);page.close()
  failures=[x for x in results if x['scrollWidth']>x['width']+1 or x['emptyImages'] or x['errors'] or x['h1']!=1 or not x['main']]
  assert not failures,failures

  # Homepage form is native GET and correctly encodes the chosen search.
  page=browser.new_page(viewport={'width':390,'height':844})
  page.set_content(inline('index.html'),wait_until='domcontentloaded')
  page.locator('#search-genre').select_option('Hip hop')
  form=page.locator('form.search')
  assert form.get_attribute('method')=='get'
  assert form.get_attribute('action')=='labels.html'
  params=page.evaluate('''() => new URLSearchParams(new FormData(document.querySelector('form.search'))).toString()''')
  assert 'genre=Hip+hop' in params,params
  page.close()

  page=browser.new_page(viewport={'width':390,'height':844})
  page.set_content(inline('labels.html'),wait_until='domcontentloaded')
  assert page.locator('#label-cards [data-card]:visible').count()==5
  page.locator('#location-filter').select_option('Amsterdam')
  assert page.locator('#label-cards [data-card]:visible').count()==2
  page.locator('#only-bridge').check()
  assert page.locator('#label-cards [data-card]:visible').count()==1
  page.locator('#genre-filter').select_option('Techno')
  assert page.locator('#label-cards [data-card]:visible').count()==0
  assert page.locator('#empty-results').is_visible()
  page.locator('#empty-reset').click()
  assert page.locator('#label-cards [data-card]:visible').count()==5
  page.locator('#sort').select_option('az')
  assert 'Beggars' in page.locator('#label-cards [data-card]:visible').first.inner_text()
  page.locator('#sort').select_option('recommended')
  assert 'Walboomers' in page.locator('#label-cards [data-card]:visible').first.inner_text()
  page.locator('#filter').fill('Béggars')
  assert page.locator('#label-cards [data-card]:visible').count()==1
  page.close()

  # Simulate an incoming GET query when rendering a static preview.
  page=browser.new_page(viewport={'width':390,'height':844})
  incoming=inline('labels.html').replace('new URLSearchParams(location.search)', "new URLSearchParams('?q=B%C3%A9ggars')")
  page.set_content(incoming,wait_until='domcontentloaded')
  assert page.locator('#filter').input_value()=='Béggars'
  assert page.locator('#label-cards [data-card]:visible').count()==1
  page.close()

  # Pinned CTA is discoverable using Tab immediately after header navigation.
  page=browser.new_page(viewport={'width':390,'height':844})
  page.set_content(inline('label-walboomers.html'),wait_until='domcontentloaded')
  for _ in range(5):page.keyboard.press('Tab')
  assert page.evaluate('document.activeElement.matches(".action a.btn")'),page.evaluate('document.activeElement.outerHTML')
  cta=page.locator('.action .btn');bar=page.locator('aside.action')
  box=cta.bounding_box();barbox=bar.bounding_box()
  assert box and barbox and 0<=box['y']<844 and box['y']+box['height']<=845
  assert not page.locator('.action-copy').is_visible(),'Mobile CTA should not waste screen space with redundant copy'
  page.keyboard.press('Tab')
  assert page.evaluate('document.activeElement.tagName.toLowerCase()==="a"'), 'Keyboard focus should continue into page content'
  page.close()

  # Stress long headings and compact/mobile layouts. No horizontal overflow.
  page=browser.new_page(viewport={'width':320,'height':700})
  page.set_content(inline('label-walboomers.html'),wait_until='domcontentloaded')
  page.locator('h1').evaluate('(el)=>el.textContent="The Very Extremely Long Independent Electronic Record Label Of An Imaginary Place"')
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
  page.close()

  browser.close()

(OUT/'v28-extended-qa.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print('Extended browser QA:',len(results),'page/viewport combinations; functional, keyboard, long-text flows OK')
