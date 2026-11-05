#!/usr/bin/env python3
"""Build the Bridge Label Directory as a static multi-page site.

Preview mode is deliberately noindex and includes only verified records plus two
clearly labelled demo-only pages. Production mode is fail-closed and requires a
separate reviewed/approved dataset, never the bundled fixture.
"""
from __future__ import annotations
import argparse
from datetime import date, timedelta
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
from urllib.parse import urlparse
from xml.sax.saxutils import escape as xml_escape

ROOT = Path(__file__).resolve().parents[1]
BASE_DIR = '/directory/record-label'
REVALIDATE_AFTER_DAYS = 45
SAFE_KEY = re.compile(r'^[a-z0-9][a-z0-9_-]{0,79}$')
SAFE_SLUG = re.compile(r'^[a-z0-9][a-z0-9_-]{0,99}$')
CATEGORIES = [
    {'kind':'genre','value':'Hip hop','slug':'hip-hop','name':'Hip hop','note':'Find labels in the Hip hop category.'},
    {'kind':'genre','value':'Techno','slug':'techno','name':'Techno','note':'Discover labels working in electronic and techno music.'},
    {'kind':'location','value':'Amsterdam','slug':'amsterdam','name':'Amsterdam','note':'Explore record labels based in Amsterdam.'},
    {'kind':'location','value':'London','slug':'london','name':'London','note':'Browse the record-label profiles for London.'},
]


def esc(value): return html.escape(str(value if value is not None else ''), quote=True)
def jld(obj): return json.dumps(obj,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')

def allowed_https(url):
    if not url or not isinstance(url,str): return False
    u=urlparse(url)
    return u.scheme=='https' and bool(u.hostname) and not (u.username or u.password or u.fragment)


def check_data(records, production):
    keys=set(); slugs=set()
    for r in records:
        for field in ('key','name','slug','status','summary','description'):
            if not isinstance(r.get(field),str) or not r[field].strip(): raise ValueError(f"Missing {field}: {r.get('key')}")
        # Identifiers become disk paths in preview and production; reject traversal
        # and malformed slugs before creating any output directory.
        if not SAFE_KEY.fullmatch(r['key']) or not SAFE_SLUG.fullmatch(r['slug']):
            raise ValueError(f'Unsafe key or slug: {r["key"]!r}')
        if r['key'] in keys or r['slug'] in slugs: raise ValueError('Duplicate key or slug')
        if r.get('logo'):
            logo=r['logo']
            if not isinstance(logo,str) or not re.fullmatch(r'label-[a-z0-9_-]+\.(?:jpg|png|webp|svg)',logo):
                raise ValueError(f'Unsafe logo path: {r["key"]}')
            if not (ROOT/'assets'/logo).is_file():
                raise ValueError(f'Logo asset missing: {r["key"]}')
        if r.get('social_image'):
            social=r['social_image']
            if not isinstance(social,str) or not re.fullmatch(r'social-[a-z0-9_-]+\.(?:jpg|png|webp)',social):
                raise ValueError(f'Unsafe social image path: {r["key"]}')
            if not (ROOT/'assets'/social).is_file():
                raise ValueError(f'Social image asset missing: {r["key"]}')
        keys.add(r['key']);slugs.add(r['slug'])
        if r['status'] not in ('on_bridge','no_bridge_inbox','unknown'): raise ValueError('Unknown submission status')
        if r.get('submission_url'):
            u=urlparse(r['submission_url'])
            if not allowed_https(r['submission_url']) or u.hostname!='inbox.bridge.audio' or u.path in ('','/'):
                raise ValueError(f'Untrusted Bridge Inbox destination: {r["key"]}')
        for f in ('official_url','source_url'):
            if r.get(f) and not allowed_https(r[f]): raise ValueError(f'Invalid {f}')
        if r['status']=='on_bridge' and not r.get('submission_url') and production: raise ValueError('Missing verified Inbox URL')
        if production:
            if not all((r.get('release_approved') is True, r.get('verified') is True, r.get('visible') is True,
                        bool(r.get('source_url')), bool(r.get('checked_at')), bool(r.get('official_url')))):
                raise ValueError(f"Record is not approved for production: {r['key']}")
            if r['status']=='unknown': raise ValueError('Unknown status must not publish')
            if r.get('status')=='on_bridge' and not r.get('submission_verified'): raise ValueError('Inbox destination unapproved')
            try:
                verified_on=date.fromisoformat(r['checked_at'])
            except (TypeError, ValueError):
                raise ValueError(f'Invalid verification date: {r["key"]}') from None
            if verified_on>date.today() or date.today()-verified_on>timedelta(days=REVALIDATE_AFTER_DAYS):
                raise ValueError(f'Reverification required for: {r["key"]}')
    if production and len(records)<1: raise ValueError('No validated records')


def builder(mode, records, output, origin=None, publish_categories=False, category_editorial=None):
    prod=mode=='production'
    if prod and (not allowed_https(origin) or urlparse(origin).path not in ('','/') or urlparse(origin).query or urlparse(origin).params):
        raise ValueError('Production requires a trusted HTTPS origin (scheme + domain, no path)')
    if prod and not records: raise ValueError('No approved records')
    check_data(records,prod)
    if prod and publish_categories and not category_editorial:
        raise ValueError('Category publication requires separately approved editorial copy')
    category_editorial = category_editorial or {}
    output=Path(output)
    if prod and output.exists() and any(output.iterdir()):
        raise ValueError('Production output directory must be empty to prevent orphan indexable pages')
    output.mkdir(parents=True,exist_ok=True)
    assets=output/'assets';assets.mkdir(exist_ok=True)
    for source in (ROOT/'assets').iterdir():
        if source.is_file() and source.suffix in ('.svg','.jpg','.png','.webp'):
            if source.resolve() != (assets/source.name).resolve(): shutil.copy2(source,assets/source.name)
    styles=(ROOT/'src/styles.css').read_text()
    app=(ROOT/'src/app.js').read_text()
    (assets/'styles.css').write_text(styles,encoding='utf-8')
    (assets/'app.js').write_text(app,encoding='utf-8')
    live=[r for r in records if r.get('visible')]
    demo=[r for r in records if not r.get('visible')]
    available={r['key']:r for r in records}

    def approved_category(cat, matched):
        if not prod:return bool(matched)
        if not publish_categories or len(matched)<3:return False
        approval=category_editorial.get(f'{cat["kind"]}:{cat["slug"]}')
        if not isinstance(approval,dict) or approval.get('release_approved') is not True:
            return False
        editorial=approval.get('description','')
        if not isinstance(editorial,str) or len(editorial.split())<80:
            raise ValueError(f'Editorial text too thin for category {cat["slug"]}')
        if not allowed_https(approval.get('source_url')):
            raise ValueError(f'Category source unverified: {cat["slug"]}')
        try:
            reviewed=date.fromisoformat(approval.get('checked_at',''))
        except (ValueError,TypeError):
            raise ValueError(f'Category verification date invalid: {cat["slug"]}') from None
        if reviewed>date.today() or date.today()-reviewed>timedelta(days=REVALIDATE_AFTER_DAYS):
            raise ValueError(f'Category review is stale: {cat["slug"]}')
        return True

    def route(kind,value=None):
        if not prod:
            if kind=='home':return 'index.html'
            if kind=='listing':return 'labels.html'
            if kind=='label':return f'label-{value}.html'
            if kind=='category':return ('in-' if value['kind']=='location' else 'for-')+value['slug']+'.html'
        else:
            if kind=='home':return BASE_DIR+'/'
            if kind=='listing':return BASE_DIR+'/all/'
            if kind=='label':return BASE_DIR+'/'+available[value]['slug']+'/'
            if kind=='category':return BASE_DIR+('/in/' if value['kind']=='location' else '/for/')+value['slug']+'/'
        raise KeyError(kind)

    def canonical(kind,value=None):return (origin or '')+route(kind,value) if prod else None
    def asset_url(name):return (BASE_DIR+'/assets/' if prod else 'assets/')+name
    def path_for(kind,value=None):
        if not prod:
            return output/route(kind,value)
        if kind=='home':return output/'index.html'
        if kind=='listing':return output/'all/index.html'
        if kind=='label':return output/available[value]['slug']/'index.html'
        if kind=='category':return output/('in' if value['kind']=='location' else 'for')/value['slug']/'index.html'
        raise KeyError(kind)

    def write(kind,content,value=None):
        path=path_for(kind,value);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content,encoding='utf-8')

    def pagehead(title,desc,kind,value=None,schema=None,image=None):
        title=esc(title);desc=esc(desc)
        url=canonical(kind,value)
        robots='index,follow,max-image-preview:large' if prod else 'noindex,nofollow'
        head=[f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
              '<meta name="theme-color" content="#ffffff">',f'<meta name="robots" content="{robots}">',
              f'<title>{title}</title><meta name="description" content="{desc}">',
              '<link rel="preconnect" href="https://fonts.googleapis.com">',
              '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
              '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap">',
              f'<link rel="stylesheet" href="{asset_url("styles.css")}">',
              f'<script src="{asset_url("app.js")}" defer></script>',
              '<meta property="og:type" content="website">',
              f'<meta property="og:title" content="{title}">',
              f'<meta property="og:description" content="{desc}">',
              '<meta name="twitter:card" content="summary">']
        if url:
            head.extend([f'<link rel="canonical" href="{esc(url)}">',f'<meta property="og:url" content="{esc(url)}">'])
        # Small label logos are not suitable social preview images. Only approved,
        # dedicated share assets should be used as og:image.
        if image and prod and image.startswith('social-') and (assets/image).is_file():
            head.append(f'<meta property="og:image" content="{esc(origin+asset_url(image))}">')
        if schema and prod:head.append(f'<script type="application/ld+json">{jld(schema)}</script>')
        head.append('</head><body><a class="skip" href="#main">Skip to content</a>')
        return ''.join(head)

    def header(active=''):
        return f'''<header class="header"><div class="container header-inner"><a class="brand" href="{route('home')}" aria-label="Bridge.audio label directory home"><img src="{asset_url('bridge-logo.svg')}" alt="Bridge.audio" width="158" height="23"></a><nav class="nav" aria-label="Main navigation"><a href="{route('home')}" {'aria-current="page"' if active=='home' else ''}>Directory</a><a href="{route('listing')}" {'aria-current="page"' if active=='listing' else ''}>Browse labels</a></nav></div></header>'''

    def footer():
        tag='Design prototype · Not connected to Bridge production' if not prod else 'Discover record labels on Bridge.audio'
        return f'''<footer class="footer"><div class="container footer-inner"><span>© Bridge.audio · Record labels directory</span><div class="footer-links"><a href="{route('listing')}">Browse labels</a><a href="https://knowledge.bridge.audio/en/label-directory" target="_blank" rel="noopener noreferrer">How it works ↗</a></div><span>{esc(tag)}</span></div></footer></body></html>'''

    def badge(record):
        if record['status']=='on_bridge':return f'<span class="badge"><img src="{asset_url("certified.svg")}" alt="" width="19" height="19">On Bridge</span>'
        if not record.get('verified'):return '<span class="badge badge-preview">Example profile</span>'
        return '<span class="badge badge-neutral">Record label</span>'

    def card(record):
        img= f'<img class="card-logo" src="{asset_url(record["logo"])}" loading="lazy" alt="" width="90" height="90">' if record.get('logo') else f'<span class="card-fallback" aria-hidden="true">{esc(record["name"][0])}</span>'
        meta=' · '.join(esc(x) for x in (record.get('location'),record.get('genre')) if x)
        return f'''<a class="card" href="{route('label',record['key'])}" data-card data-key="{esc(record['key'])}" data-title="{esc(record['name'].lower())}" data-search="{esc(' '.join(str(record.get(f) or '') for f in ('name','location','genre')))}" data-location="{esc(record.get('location') or '')}" data-genre="{esc(record.get('genre') or '')}" data-bridge="{str(record['status']=='on_bridge').lower()}" data-example="{str(not record.get('verified')).lower()}"><span class="card-main">{img}<span><span class="card-title">{esc(record['name'])}</span><span class="card-meta">{meta or 'Sample profile'}</span></span></span><span class="card-footer">{badge(record)}<span class="card-cta">View profile <span class="card-arrow" aria-hidden="true">↗</span></span></span></a>'''

    def breadcrumb(items):
        out=['<nav class="crumb" aria-label="Breadcrumb"><a href="'+route('home')+'">Directory</a>']
        for text,href in items:
            out.append('<span aria-hidden="true">/</span>')
            if href:out.append(f'<a href="{href}">{esc(text)}</a>')
            else:out.append(f'<span aria-current="page">{esc(text)}</span>')
        return ''.join(out)+'</nav>'

    def breadcrumb_schema(items,cur_url):
        items=[('Record labels directory',canonical('home'))]+items
        return {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[
            {'@type':'ListItem','position':n,'name':name,'item':url or cur_url}
            for n,(name,url) in enumerate(items,1)]}

    def item_list_schema(rows):
        return {'@context':'https://schema.org','@type':'ItemList','itemListElement':[
            {'@type':'ListItem','position':i,'name':r['name'],'url':canonical('label',r['key'])}
            for i,r in enumerate(rows,1)]}

    def search_form():
        loc=sorted({r['location'] for r in live if r.get('location')})
        genres=sorted({r['genre'] for r in live if r.get('genre')})
        return f'''<form class="search" action="{route('listing')}" method="get" role="search" aria-label="Find a record label"><div class="search-field"><label for="search-label">Label name</label><input type="search" id="search-label" name="q" placeholder="Search a label" autocomplete="off"></div><div class="search-field"><label for="search-location">Location</label><select id="search-location" name="location"><option value="">All locations</option>{''.join(f'<option value="{esc(x)}">{esc(x)}</option>' for x in loc)}</select></div><div class="search-field"><label for="search-genre">Genre</label><select id="search-genre" name="genre"><option value="">All genres</option>{''.join(f'<option value="{esc(x)}">{esc(x)}</option>' for x in genres)}</select></div><button class="btn" type="submit">Search <span aria-hidden="true">↗</span></button></form>'''

    # Homepage
    hero=f'''<main id="main"><section class="hero"><div class="container"><h1>Record labels directory</h1><p class="hero-subtitle">Don't waste your time, just <strong>send</strong> your tracks to the right inbox</p>{search_form()}</div></section>'''
    available_cats=[(cat,[r for r in live if r.get(cat['kind'])==cat['value']]) for cat in CATEGORIES]
    available_cats=[(cat,matching) for cat,matching in available_cats if approved_category(cat,matching)]
    sections=[]
    if available_cats:
        sections.append('<section class="section container"><div class="section-heading"><div><h2>Explore by genre and location</h2><p class="section-subtitle">Start with a sound or a city</p></div></div><div class="explore-grid">')
        for cat,matching in available_cats:
            typ='Genre' if cat['kind']=='genre' else 'Location'
            sections.append(f'''<a class="explore-tile" href="{route('category',cat)}"><span class="explore-label">{typ}</span><span class="explore-bottom"><span><span class="explore-title">{esc(cat['name'])}</span><br><span class="explore-count">{len(matching)} label{'s' if len(matching)!=1 else ''}</span></span><span class="explore-arrow" aria-hidden="true">↗</span></span></a>''')
        sections.append('</div></section>')
    sections.append(f'''<section class="section container home-rail"><div class="section-heading"><div><h2>Discover record labels</h2><p class="section-subtitle">Browse their profiles and find the right submission route</p></div><a class="inline-link" href="{route('listing')}">Browse all labels ↗</a></div><div class="cards">''')
    sections.extend(card(r) for r in live)
    sections.append('</div></section></main>')
    home_schema=({'@context':'https://schema.org','@type':'CollectionPage','name':'Record labels directory','url':canonical('home'),'mainEntity':item_list_schema(live)} if prod else None)
    write('home',pagehead('Record labels directory | Bridge.audio','Browse record labels by name, genre or location. Find profiles and available submission links on Bridge.audio.','home',schema=home_schema)+header('home')+hero+''.join(sections)+footer())

    # Listing
    opts=lambda vals:''.join(f'<option value="{esc(x)}">{esc(x)}</option>' for x in vals)
    locs=sorted({r['location'] for r in live if r.get('location')});genres=sorted({r['genre'] for r in live if r.get('genre')})
    filters=f'''<form class="filter-panel" id="filters-form" action="{route('listing')}" role="search" aria-label="Filter record labels"><div class="filters"><div class="filter-field"><label for="filter">Label name or keyword</label><input type="search" name="q" id="filter" placeholder="Search labels" autocomplete="off"></div><div class="filter-field"><label for="location-filter">Location</label><select name="location" id="location-filter"><option value="">All locations</option>{opts(locs)}</select></div><div class="filter-field"><label for="genre-filter">Genre</label><select name="genre" id="genre-filter"><option value="">All genres</option>{opts(genres)}</select></div></div><div class="filter-extra"><label><input type="checkbox" id="only-bridge"> On Bridge only</label><button type="button" class="btn btn-text" id="reset-filters">Clear filters</button></div></form>'''
    content=f'''<main id="main"><div class="container">{breadcrumb([('Browse labels',None)])}<div class="list-head"><h1>Browse record labels</h1><p>Explore record labels by name, location and musical style. A blue badge identifies labels with a Bridge Inbox.</p></div>{filters}<noscript><p class="noscript-notice">The interactive directory filters require JavaScript in this preview. All label profiles remain available below.</p></noscript><div class="listing-toolbar"><p class="result-count" id="result-count" aria-live="polite" aria-atomic="true" role="status">{len(live)} labels</p><label class="sort-control" for="sort">Sort <select class="sort-select" id="sort"><option value="recommended">Featured</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option><option value="bridge">On Bridge first</option></select></label></div><div class="listing-content"><div class="cards" id="label-cards">{''.join(card(r) for r in live)}</div><div class="cards-empty" id="empty-results" hidden><strong>No matching labels</strong><p>Try another name, genre or location.</p><button type="button" class="btn btn-secondary" id="empty-reset">Clear filters</button></div></div></div></main>'''
    listing_schema={'@context':'https://schema.org','@type':'CollectionPage','name':'Browse record labels','url':canonical('listing'),'mainEntity':item_list_schema(live)} if prod else None
    write('listing',pagehead('Browse record labels | Bridge.audio','Search for record labels by name, location, genre and Bridge Inbox status.','listing',schema=listing_schema)+header('listing')+content+footer())

    # Category landings: only render categories with real rows
    for cat in CATEGORIES:
        matching=[r for r in live if r.get(cat['kind'])==cat['value']]
        if not approved_category(cat, matching):continue
        name=(cat['name']+' record labels') if cat['kind']=='location' else (cat['name']+' record labels')
        editorial=category_editorial.get(f'{cat["kind"]}:{cat["slug"]}',{}) if prod else {}
        intro=f'''<main id="main"><div class="container">{breadcrumb([('Browse labels',route('listing')),(name,None)])}<div class="list-head"><span class="overline">{'Location' if cat['kind']=='location' else 'Music genre'}</span><h1>{esc(name)}</h1><p>{esc(cat['note'])}</p></div><div class="category-intro"><p>{esc(editorial['description']) if prod else ('Explore the available label profiles in this location. Browse other locations and genres through the full directory.' if cat['kind']=='location' else 'Explore labels associated with this musical category, then visit each profile for its available submission options.')}</p></div><div class="listing-toolbar"><p class="result-count">{len(matching)} label{'s' if len(matching)!=1 else ''} in this selection</p><a class="inline-link" href="{route('listing')}">All record labels ↗</a></div><div class="cards">{''.join(card(r) for r in matching)}</div><div class="section"><div class="section-heading"><div><h2>Explore other categories</h2><p class="section-subtitle">Continue browsing the directory</p></div></div><div class="category-links">{''.join(f'<a href="{route("category",other)}">{esc(other["name"])} ↗</a>' for other in CATEGORIES if other != cat and approved_category(other,[r for r in live if r.get(other['kind'])==other['value']]))}</div></div></div></main>'''
        cat_schema={'@context':'https://schema.org','@type':'CollectionPage','name':name,'url':canonical('category',cat),'mainEntity':item_list_schema(matching),'breadcrumb':breadcrumb_schema([('Browse labels',canonical('listing')),(name,None)],canonical('category',cat))} if prod else None
        write('category',pagehead(name+' | Bridge.audio','Browse '+name.lower()+' and explore verified Bridge directory profiles.','category',cat,cat_schema)+header()+intro+footer(),cat)

    # Label profiles
    for r in records:
        key=r['key'];name=r['name'];status=r['status'];is_on=status=='on_bridge'
        image=(f'<img class="profile-logo" src="{asset_url(r["logo"])}" alt="{esc(name)} logo" width="140" height="140">' if r.get('logo') else f'<span class="profile-logo profile-fallback" aria-hidden="true">{esc(name[0])}</span>')
        tag_parts=[badge(r)]+[f'<span class="pill">{esc(r[prop])}</span>' for prop in ('location','genre') if r.get(prop)]
        identity=f'''<section class="profile-hero"><div class="profile-identity">{image}<div><span class="overline">Record label</span><h1>{esc(name)}</h1><div class="meta-row">{''.join(tag_parts)}</div></div></div><p class="profile-lead">{esc(r['summary'])}</p>'''
        if not r['verified']:identity+='<div class="preview-note">Illustrative profile only. The label identity, description and status are not verified.</div>'
        identity+='</section>'
        factrows=[]
        for k2,label in (('location','Location'),('genre','Genre'),('year','Created')):
            if r.get(k2):factrows.append(f'<div class="info-row"><dt>{label}</dt><dd>{esc(r[k2])}</dd></div>')
        factrows.append(f'<div class="info-row"><dt>On Bridge</dt><dd>{"Yes" if is_on else ("Not shown" if status=="unknown" else "No Inbox shown")}</dd></div>')
        verified_label=('Source: public directory · checked '+date.fromisoformat(r['checked_at']).strftime('%b %Y')) if r.get('source_url') and r.get('checked_at') else 'Illustrative, unverified data'
        info=f'''<aside class="info-panel" aria-labelledby="info-title"><h2 id="info-title">At a glance</h2><dl>{''.join(factrows)}</dl><p class="info-foot">{esc(verified_label)}</p></aside>'''
        section_desc=f'<section class="profile-section"><h2>About {esc(name)}</h2><p>{esc(r["description"])}</p></section>'
        if is_on:
            sec_submit=''  # Sticky CTA already describes and links to the Inbox; no repeated section.
        elif status=='unknown':
            sec_submit='<section class="profile-section"><h2>Music submissions</h2><p>No verified submission channel is available for this illustrative profile.</p></section>'
        else:
            sec_submit='<section class="profile-section"><h2>Music submissions</h2><p>No direct Bridge Inbox is listed on this directory profile. Check the label’s official website for its current contact or demo submission information.</p></section>'
        links=[]
        if r.get('official_url'):links.append(f'<a href="{esc(r["official_url"])}" target="_blank" rel="noopener noreferrer">Official website <span aria-hidden="true">↗</span></a>')
        if r.get('source_url') and not prod:links.append(f'<a href="{esc(r["source_url"])}" target="_blank" rel="noopener noreferrer">Existing Bridge profile <span aria-hidden="true">↗</span></a>')
        linksection=f'<section class="profile-section"><h2>Official links</h2><div class="official-links">{"".join(links)}</div></section>' if links else ''
        related=[other for other in live if other['key']!=key and (other.get('location') and other['location']==r.get('location') or other.get('genre') and other['genre']==r.get('genre'))][:4]
        relatedsection=f'<section class="related"><h2>Explore more labels</h2><div class="related-links">{"".join(f"<a href={chr(34)}{route('label',other['key'])}{chr(34)}>{esc(other['name'])} ↗</a>" for other in related)}</div></section>' if related else ''
        crumb=breadcrumb([('Browse labels',route('listing')),(name,None)])
        body=f'''<main id="main" class="profile"><div class="container">{crumb}{identity}<div class="profile-grid"><div>{section_desc}{sec_submit}{linksection}</div>{info}</div>{relatedsection}<a class="back-link" href="{route('listing')}">← Back to all labels</a></div></main>'''
        if is_on and r.get('submission_url'):
            actionbtn=f'<a class="btn" aria-label="Send music to {esc(name)} on Bridge Inbox (opens in a new tab)" href="{esc(r["submission_url"])}" target="_blank" rel="noopener noreferrer">Send music to this label <span aria-hidden="true">↗</span></a>'
            copy='Open this label’s Bridge Inbox'
        elif is_on:
            # Production validator prohibits this, but preview is honest.
            actionbtn='<button type="button" class="btn" data-preview>Send music to this label <span aria-hidden="true">↗</span></button>'
            copy='Inbox destination not configured in this preview'
        else:
            actionbtn='<span class="no-action" role="status" aria-label="Direct Bridge submissions unavailable">Not available for this label</span>'
            copy='No direct Bridge Inbox link on this profile' if r['verified'] else 'Example profile: status not verified'
        action=f'''<aside class="action {'is-muted' if not is_on else ''}" aria-label="Music submission"><div class="container action-inner"><div class="action-copy"><strong>{'Send music to '+esc(name) if is_on else 'Music submissions'}</strong><small>{esc(copy)}</small></div>{actionbtn}</div></aside>'''
        if is_on and not r.get('submission_url'):
            action+='<dialog id="preview-dialog" aria-labelledby="preview-title"><form method="dialog"><h2 id="preview-title">Submission preview</h2><p>This label appears On Bridge, but no Inbox URL is configured in this prototype. Nothing has been sent.</p><button class="btn" type="submit">Close</button></form></dialog>'
        profile_schema=None
        if prod:
            cur=canonical('label',key)
            profile_schema={'@context':'https://schema.org','@graph':[
                {'@type':'BreadcrumbList','itemListElement':breadcrumb_schema([('Browse labels',canonical('listing')),(name,None)],cur)['itemListElement']},
                {'@type':'Organization','@id':cur+'#label','name':name,'url':r['official_url'],'mainEntityOfPage':cur,'description':r['summary']}
            ]}
        location_part=f' in {r["location"]}' if r.get('location') else ''
        genre_part=f' ({r["genre"]})' if r.get('genre') else ''
        if is_on:
            meta_description=f'Explore {name}{location_part}{genre_part} and its Bridge Inbox music submission link.'
        else:
            meta_description=f'Explore {name}{location_part}{genre_part}, its profile and available official contact information.'
        write('label',pagehead(f'{name} | Record label | Bridge.audio',meta_description,'label',key,profile_schema,r.get('social_image'))+header()+action+body+footer(),key)

    # Preview-only entry points for demo states and publication artifacts.
    if not prod:
        # For a nested GitHub Pages preview, only the HTML noindex meta is authoritative; a nested robots.txt has no host-level meaning.
        (output/'PREVIEW-NOT-INDEXABLE.txt').write_text('Every HTML page is noindex. This ZIP is not a Bridge production deployment.\n')
    else:
        all_routes=[canonical('home'),canonical('listing')]+[canonical('category',cat) for cat in CATEGORIES if approved_category(cat,[r for r in live if r.get(cat['kind'])==cat['value']])]+[canonical('label',r['key']) for r in live]
        xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+xml_escape(x)+'</loc></url>' for x in all_routes)+'</urlset>\n'
        (output/'sitemap.xml').write_text(xml)
        (output/'robots.sample.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+origin+BASE_DIR+'/sitemap.xml\n')
        notfound=pagehead('Page not found | Bridge.audio','The requested record-label profile was not found.','home')
        notfound=notfound.replace('index,follow,max-image-preview:large','noindex,nofollow')
        notfound=re.sub(r'<link rel="canonical"[^>]+>','',notfound)
        notfound=re.sub(r'<meta property="og:url"[^>]+>','',notfound)
        (output/'404.html').write_text(notfound+header()+'<main id="main" class="container list-head"><h1>Page not found</h1><p>This label may have moved or is no longer listed.</p><a class="btn" href="'+route('home')+'">Browse labels</a></main>'+footer())
    return {'pages':2+len(records)+sum(approved_category(c,[r for r in live if r.get(c['kind'])==c['value']]) for c in CATEGORIES),'mode':mode,'output':str(output)}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--mode',choices=['preview','production'],default='preview')
    parser.add_argument('--data',type=Path,default=ROOT/'content/labels.json')
    parser.add_argument('--output',type=Path,default=ROOT)
    parser.add_argument('--origin',default=None,help='Public HTTPS origin. Required in production mode.')
    parser.add_argument('--publish-categories',action='store_true',help='Production only: release approved editorial category pages with 3+ validated profiles.')
    parser.add_argument('--category-editorial',type=Path,help='Separate reviewed category content JSON, needed for production categories.')
    args=parser.parse_args()
    if args.mode=='production' and args.data.resolve()==(ROOT/'content/labels.json').resolve():
        parser.error('Refusing production build from bundled prototype data. Supply a separate approved data file.')
    rows=json.loads(args.data.read_text())
    editorial=json.loads(args.category_editorial.read_text()) if args.category_editorial else None
    print(json.dumps(builder(args.mode,rows,args.output,args.origin,args.publish_categories,editorial),ensure_ascii=False))

if __name__=='__main__': main()
