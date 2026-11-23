# Bridge.audio | Compare pages

Five English comparison pages forming one **Bridge Compare** collection. They are review prototypes (`noindex,nofollow`) and are **not evidence of production availability or of an approved public launch.**

| Directory (= production slug) | Comparison | Production URL (planned) |
| --- | --- | --- |
| `alternative-to-disco/` | Bridge vs DISCO | `https://www.bridge.audio/compare/alternative-to-disco/` |
| `alternative-to-untitled/` | Bridge vs [untitled] | `https://www.bridge.audio/compare/alternative-to-untitled/` |
| `alternative-to-wetransfer/` | Bridge vs WeTransfer | `https://www.bridge.audio/compare/alternative-to-wetransfer/` (replaces the live page) |
| `alternative-to-soundcloud/` | Bridge vs SoundCloud | `https://www.bridge.audio/compare/alternative-to-soundcloud/` (replaces the live page) |
| `alternative-to-dropbox-google-drive/` | Bridge vs Dropbox, Box & Google Drive | `https://www.bridge.audio/compare/alternative-to-dropbox-google-drive/` |

The old preview folders (`disco/`, `untitled/`, `wetransfer/`, `soundcloud/`, `cloud-storage/`) only contain a redirect to the new folder, so links already shared keep working.

## Structure

```text
compare/
  <page>/index.html          page content and page-specific layout (inline <style>/<script>)
  assets/compare.css         shared shell + design tokens (loaded after each page's own CSS)
  assets/compare.js          shared header behaviour (dropdowns, mobile menu, compare strip)
  assets/img/                product screenshots, shared by all pages (WebP)
  assets/fonts/              Inter variable (latin subset, SIL OFL 1.1 — see OFL-Inter.txt)
  assets/favicon.svg         Bridge glyph
  _partials/header.html      shared header + "Bridge vs" switcher (single source of truth)
  _partials/footer.html      shared footer (mirrors the live bridge.audio footer + a Compare column)
  _tools/apply_shell.py      stamps the partials into the five pages
```

Folders starting with `_` are not published by GitHub Pages (Jekyll).

### Editing the shared header or footer

1. Edit `_partials/header.html` or `_partials/footer.html`.
2. Run `python3 compare/_tools/apply_shell.py` (standard library only).
3. `python3 compare/_tools/apply_shell.py --check` exits with 1 if a page is out of date (usable in CI).

The script copies the partial between `<!-- bc:header:start/end -->` and `<!-- bc:footer:start/end -->` markers and adds `aria-current="page"` to the current page in the switcher and footer.

### Links between comparisons

Compare links are **relative** (`../alternative-to-wetransfer/`) and the folder names are the production slugs, so the same links work under the GitHub Pages prefix (`/bridge-tools/compare/…`) and at `/compare/…` on bridge.audio, as long as the five folders stay siblings. All other links point to absolute `https://www.bridge.audio/…` destinations taken from the live site footer and navigation.

## Shared design system

Defined in `assets/compare.css` (`:root` tokens) and based on the current bridge.audio navigation and the strongest existing pages (DISCO, SoundCloud).

| Token | Value |
| --- | --- |
| Font | Inter (self-hosted variable), system fallback |
| Ink / text / muted | `#252428` / `#4f535c` / `#666b75` (fine print `#6b7079`, ≥ 4.5:1 on white) |
| Bridge blue / hover / tint | `#3455eb` / `#2344d5` / `#f1f4ff` |
| Lines / soft background | `#e3e6ed` / `#f8f9fb` |
| Content width | 1170px, 32px gutters (20px under 700px) |
| Hero title | `clamp(42px, 5vw, 70px)`, 730, −0.058em (38–50px on mobile) |
| Section title | `clamp(31px, 3.6vw, 48px)`, 720, −0.048em (28–36px on mobile) |
| Eyebrow | 12px, 750, +0.13em, uppercase |
| Buttons | 48px min height, 10px radius, 14px/700 |
| Section rhythm | 88px (60px on mobile) |

The pages were authored separately and keep their own class names and layouts; `compare.css` aligns their headings (`.eyebrow + h1/h2`, `.kicker + …`, `.dc-eyebrow + …`), buttons (`.btn`, `.button`, `.dc-btn`) and containers (`.wrap`, `.container`, `.dc-container`). Each page keeps its own storytelling and layout.

## Visual sources

- All Bridge screenshots are actual Bridge interfaces previously supplied for these pages, now served from `assets/img/` instead of base64 strings.
- `bridge-sync-contact-panel-1672.webp` (SoundCloud page, "Let the right people find you") is the existing Bridge Sync screenshot with the **Contact rights holder** panel open, reused from `landing-upload/assets/`. The sender email, the recipient's name and the account avatar were replaced with neutral placeholders (`music.supervisor@agency.com`, `Rights team`).
- WeTransfer page: the expired transfer is an **HTML illustration labelled as such**, not a WeTransfer screenshot (no current authentic capture was available from the build environment).
- Cloud Storage page: the Google Drive folder is a **recreated list view labelled as an illustration**, using Drive's real columns and noting that Drive previews audio. Track names 04–05 are illustrative.
- DISCO page: the DISCO wordmark is now plain text; the previous version hot-linked DISCO's CDN logo.

## Shared page components

- **Final call to action** `.bc-cta`: same dark block, eyebrow, two-line title and two buttons (Try Bridge for free + one secondary link) on every page.
- **Comparison tables**: competitor column(s) first, Bridge.audio last; neutral header, Bridge column in blue (rules at the end of `compare.css`).
- **Section eyebrows**: plain labels; numbered sections use `01 · LABEL`.

## Fact check (23 November 2026)

Checked against official pages: WeTransfer Free (10 transfers or 3 GB per rolling 30 days, up to 3 days, non-commercial; Ultimate keeps transfers active), SoundCloud Basic (2 hours of uploads), DISCO (Plus $16.99 / Pro $26.99 per month billed annually for 1 user and 1K files; Artist $10.80 with 2 seats; Discovery Suite from $10/month; free trial), [untitled] (free Starter; Membership $7.99/month or $49.99/year), Box Individual (10 GB, 250 MB per file). Bridge plan figures follow 09 — Commercial Offers (Free; Talent Pro from €5/month; Music Pro from €9/month). The live bridge.audio pricing page did not expose plan prices to automated reading; re-check visually before launch.

## SEO and GEO decisions (23 November 2026)

- **URLs**: folders use the production slugs, following the pattern bridge.audio already uses (`/compare/alternative-to-wetransfer/` and `/compare/alternative-to-soundcloud/` are live). Reusing those two URLs keeps their existing links and ranking; the new pages follow the same "alternative to X" pattern, which matches how people search ("WeTransfer alternative for music").
- **Canonical + `og:url`** point to the production URLs above.
- **`noindex,nofollow` stays on the GitHub Pages preview.** When the pages are deployed on bridge.audio, delete the robots line in each page's `<head>` (the canonical is already correct).
- **Structured data** (one JSON-LD graph per page): `WebPage` with `dateModified`, publisher and `about` (Bridge.audio + the competitor), `BreadcrumbList` (Bridge.audio › Compare › page) and the page's `FAQPage`. Keep `dateModified` in step with the visible "checked" dates.
- **GEO** (answers in AI assistants): facts are stated as short, dated, sourced sentences (FAQ, tables, "Sources & methodology"), in text rather than images.
- `og:image` is still missing: add a 1200×630 image per page when available.
- Bridge pricing will change in early 2027: update the figures on all five pages at the same time (search for "€5" and "€9").

## Customer proof

Only quotes **already published by Bridge** (bridge.audio home page or customer stories) are used, with the same speaker and company, as required by 06 — Customer References & Proof: Velvetica (DISCO), Wiseband and Ulrich Forman (SoundCloud), Fabrice Desprez / Phunk Promotion (WeTransfer), Bertrand Burgalat / Tricatel ([untitled]), Jules Vidal / Allo Floride (Dropbox, Box & Google Drive). Feedback from Slack #bridge-of-love or private emails is not used until the person gives permission.

## Review and publishing

- Work happens on a feature branch with one pull request to `main`. Do not merge or deploy without explicit approval.
- The repository has no Pages workflow (`.github/` is absent), so GitHub Pages builds from a branch set in the repository settings — presumably `main`, given the preview URLs. In that case, merging publishes the changes on the preview site.
- Never commit tokens, secrets, signed URLs or credentials.
