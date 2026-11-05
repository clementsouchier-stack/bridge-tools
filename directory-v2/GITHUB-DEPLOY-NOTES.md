# Publishing notes for `bridge-tools/directory-v2/`

## Where files live

Files are committed under `directory-v2/` in the existing `clementsouchier-stack/bridge-tools` repository. The top-level `index.html` is directly under that folder, not under another `site/` layer. The other repository folders remain unchanged.

## GitHub Pages: preview only

- GitHub repository existence does not automatically enable GitHub Pages. Configure `Settings > Pages`, source `main / (root)` (if not already configured), for this repository. That choice affects the whole `bridge-tools` Pages publication.
- Expected preview address, only when Pages is enabled: `https://clementsouchier-stack.github.io/bridge-tools/directory-v2/`. Do not represent it as live until a browser check confirms it.
- Every generated HTML file intentionally carries `<meta name="robots" content="noindex,nofollow">`. The preview is public but not a production SEO release.
- A nested `/bridge-tools/directory-v2/robots.txt` is **not** the domain's robots policy. The global `robots.txt` belongs at the host root, which may serve other projects. Do not change it for this prototype.

## SEO production work that cannot be done merely by committing GitHub files

1. Confirm actual Bridge.audio directory route mappings and adopt production-rendered URLs with HTTP 200/301/404/410 semantics.
2. Feed verified, reviewed label data and approved Inbox links to the guarded exporter. Do not index illustrative labels.
3. Deploy output to the Bridge-controlled domain, with correct HTTPS canonicals, OG URLs, JSON-LD and a sitemap at the actual indexable host path.
4. Integrate site-wide robots policy via the real host, audit Search Console/Bing and monitor indexing and conversions.
5. Publish editorial location/genre pages only after factual review; no thin faceted URLs.
6. Confirm Bridge Design System and accessibility compliance in staging.

Please avoid interpreting a GitHub preview's organic performance as representative of the production site's SEO.
