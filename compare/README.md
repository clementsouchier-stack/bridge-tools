# Bridge.audio | Compare pages

Five English comparison pages forming one **Bridge Compare** collection. They are review prototypes (`noindex,nofollow`) and are **not evidence of production availability or of an approved public launch.**

| Directory | Comparison | Preview |
| --- | --- | --- |
| `disco/` | Bridge vs DISCO | `/bridge-tools/compare/disco/` |
| `untitled/` | Bridge vs [untitled] | `/bridge-tools/compare/untitled/` |
| `wetransfer/` | Bridge vs WeTransfer | `/bridge-tools/compare/wetransfer/` |
| `soundcloud/` | Bridge vs SoundCloud | `/bridge-tools/compare/soundcloud/` |
| `cloud-storage/` | Bridge vs Dropbox, Box & Google Drive | `/bridge-tools/compare/cloud-storage/` |

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

Compare links are **relative** (`../wetransfer/`), so they resolve both under the GitHub Pages prefix (`/bridge-tools/compare/…`) and at `/compare/…` on a future bridge.audio deployment, as long as the five folders stay siblings. If production uses different slugs (bridge.audio currently publishes e.g. `/compare/alternative-to-wetransfer`), update the hrefs in the partials and re-run the script. All other links point to absolute `https://www.bridge.audio/…` destinations taken from the live site footer and navigation.

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
- `cloud-storage/*.png` are earlier review screenshots, not used by the page; kept untouched.

## Shared page components

- **Final call to action** `.bc-cta`: same dark block, eyebrow, two-line title and two buttons (Try Bridge for free + one secondary link) on every page.
- **Comparison tables**: competitor column(s) first, Bridge.audio last; neutral header, Bridge column in blue (rules at the end of `compare.css`).
- **Section eyebrows**: plain labels; numbered sections use `01 · LABEL`.

## Fact check (23 November 2026)

Checked against official pages: WeTransfer Free (10 transfers or 3 GB per rolling 30 days, up to 3 days, non-commercial; Ultimate keeps transfers active), SoundCloud Basic (2 hours of uploads), DISCO (Plus $16.99 / Pro $26.99 per month billed annually for 1 user and 1K files; Artist $10.80 with 2 seats; Discovery Suite from $10/month; free trial), [untitled] (free Starter; Membership $7.99/month or $49.99/year), Box Individual (10 GB, 250 MB per file). Bridge plan figures follow 09 — Commercial Offers (Free; Talent Pro from €5/month; Music Pro from €9/month). The live bridge.audio pricing page did not expose plan prices to automated reading; re-check visually before launch.

## SEO and metadata decisions (pending)

- All five pages keep `noindex,nofollow`. A `noindex` directive does not make a public repository private.
- **No `<link rel="canonical">` and no `og:url`** while the pages are noindex prototypes: a canonical on a noindex page sends mixed signals, and GitHub Pages URLs must never become canonical. Previously DISCO pointed to `https://www.bridge.audio/compare/alternative-to-disco/` (not found in the live bridge.audio footer) and SoundCloud to `…/alternative-to-soundcloud/` (live). Decide production URLs, then add canonical + `og:url` together.
- `og:image` is not set (no approved social image). `twitter:card` is `summary` until one exists.
- SoundCloud's JSON-LD still references its live bridge.audio URL; review with the canonical decision.

## Review and publishing

- Work happens on a feature branch with one pull request to `main`. Do not merge or deploy without explicit approval.
- The repository has no Pages workflow (`.github/` is absent), so GitHub Pages builds from a branch set in the repository settings — presumably `main`, given the preview URLs. In that case, merging publishes the changes on the preview site.
- Never commit tokens, secrets, signed URLs or credentials.
