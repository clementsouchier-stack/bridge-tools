# Label Directory V28 | SEO and AI discoverability release contract

## Fundamental architecture

- The local prototype uses **13 distinct HTML documents**. Every page contains visible, meaningful content in its original HTML: no hash-route shell and no JavaScript dependency for profile text.
- Production output is derived **only from a separately approved dataset** and uses the existing Bridge directory's canonical route family. Never replace production routes or create redirects before checking the live router and existing path behavior.
- Production-only tags include self-referencing absolute canonical URLs, Open Graph URLs and `CollectionPage`, `ItemList`, `BreadcrumbList`, or `Organization` JSON-LD where appropriate. The actual visible content must support every schema property.
- The exporter generates a sitemap and a sample robots policy, but HTTP 200/301/404/410 responses and `robots.txt` integration belong to the host/router. The sample 404 page is noindex and contains no homepage canonical.
- The preview is **explicitly noindex,nofollow** and must not be opened to crawlers as a public factual dataset.

## Critical release gates already enforced in code

- Data identifiers must be safe filename/slug tokens; image paths must match known, existing local assets.
- No label may publish unless `visible`, `verified`, and `release_approved` are true with recent verifiable `source_url`, official website and ISO `checked_at`. Data older than **45 days** or dated in the future fails the build.
- An `on_bridge` label requires a reviewed `submission_url` hosted by `inbox.bridge.audio` and `submission_verified=true`. Do not infer Inbox URLs from the label slug.
- Public category pages are **opt-in only** and require at least 3 validated label records, separate approved 80+ word editorial context, cited source and fresh approval date. The homepage links only to categories actually generated.
- Production output directories must be empty so removed records do not leave orphaned indexable pages.
- A 90 px label logo is not an acceptable Open Graph share asset. A dedicated, licensed social image should be reviewed and supplied separately.

## AI search: build understandable, citable entities rather than manipulating crawlers

For each record in the future live catalogue, maintain:
`label_id`, canonical name, authoritative `source_url`, official website, verified logo/license, genre/location with an appropriate taxonomy, source owner, `checked_at`, real on-Bridge membership, current Inbox route and submission acceptance/closure status. Data exposed in HTML, JSON-LD and filters must agree.

Write useful descriptions from verified sources, with meaningful facts and specific details. Link to official label sites and curated genre/location pages only when those pages provide real value. Avoid fabricated FAQ answers, ratings, relationships, keywords or “AI-friendly” invisible text. `llms.txt` can be optional, not an SEO substitute or a guarantee of AI citations.

## SEO production validation

1. Validate each page's unique title, concise description, one H1, canonical, hreflang (only if translated pages exist), official external links, and internal link destinations.
2. Verify sitemap absolute URLs and their actual HTTP 200 responses. Do not list 404, redirected, noindexed or unapproved pages.
3. Ensure category pages are substantial rather than thin faceted combinations. Filter-query pages should canonically resolve to the indexable base; preserve user search behavior while managing crawler duplicates.
4. Inspect Google Search Console / Bing Webmaster Tools coverage, crawl/index logs, structured-data validation and Core Web Vitals on deployed URLs.
5. Confirm that CDN/WAF/robots policies allow intended crawlers while respecting privacy and bot policies.
6. Measure impressions, non-brand clicks, indexed approved profiles, profile-to-Inbox clicks, submission starts/completions and AI-originating referrals where identifiable. Distinguish measured values from estimates and unknown traffic.

Google Search Central documentation: 
- Canonicals: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Breadcrumb structured data: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- Sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

## Remaining integration ownership

- **Production / GitLab**: current routes, actual rendering, Design System and Inbox destination API.
- **Notion Product**: approved requirements and release decisions.
- **Canonical Bridge docs**: naming, product architecture and brand definitions.
- **Content owner**: copyright, accuracy and review cadence for every published label.
- **Marketing/data**: canonical metrics, Search Console ownership, editorial category strategy and tracking plans.

No amount of static schema work alone can guarantee ranking or AI assistant citations.
