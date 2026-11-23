# Bridge Compare — visual QA report (22 November 2026)

Branch `feature/compare-final-harmonization`, based on `main` @ `090c37e`.
Screens in `_qa/2026-11-22/` (not published by GitHub Pages). They can be dropped before merge.

## How the checks were run

- Pages served locally over HTTP from the repository root (same `/compare/<page>/` structure as GitHub Pages) and rendered in headless Chrome.
- The live GitHub Pages site and bridge.audio could **not** be opened from the build environment (outbound browser traffic blocked). Live-vs-branch comparison therefore used the pre-change commit `090c37e` rendered locally as the "before" state. The bridge.audio footer structure was retrieved as text (links and columns), not as a rendering.

## Automated checks — 40 renders (5 pages × 320, 375, 390, 430, 768, 1024, 1440, 1920 px)

| Check | Result |
| --- | --- |
| Horizontal scroll (`scrollWidth > viewport`) | 0 / 40 |
| Elements overflowing the viewport (unclipped) | 0 |
| Broken / missing images | 0 |
| Console errors and page errors | 0 (favicon 404 fixed) |
| French text in content, alt text, ARIA labels, scripts, JSON-LD | 0 (only language names in the language switcher) |
| `lang="en"` on all pages | 5 / 5 |
| Shell partials in sync (`_tools/apply_shell.py --check`) | up to date |
| Secret patterns (API keys, tokens, signed URLs) in `compare/` | none |

## Interaction checks (desktop 1440 px and mobile 390 px)

102 of 107 scripted checks pass; the 5 "first Tab" failures are a test-order artefact (the test tabbed after closing the menu). Re-run on a fresh load: the skip link is the first focus stop and jumps to `#main` on all five pages.

- Mobile menu opens, sets `aria-expanded`, closes with Escape and returns focus to the button; focus stays inside the open menu.
- Desktop dropdowns open with Enter and close with Escape.
- Compare strip: the current page is marked `aria-current` and scrolled fully into view on mobile.
- Every Compare link (switcher + footer, 10 per page) returns 200 from every page.
- All in-page anchors resolve to an existing id.
- Tabs/steppers on every page switch with click and arrow keys; FAQs open; screenshot "Enlarge" dialogs open and close with Escape.

## Known defects — verified

| Defect | Status | Evidence |
| --- | --- | --- |
| DISCO mobile illustrations | Fixed: legible crops, workspace shot no longer cut, phones side by side and labelled | `03-disco-mobile-illustrations-390.webp` |
| WeTransfer section "01 · AUSSI SIMPLE" | Redesigned (lifecycle comparison) and translated | `01-…-desktop.webp`, `02-…-390.webp` |
| SoundCloud comparison header | Fixed: one aligned logo + name per column | `04-soundcloud-comparison-header.webp` |
| SoundCloud "Let the right people find you" | Actual Bridge Sync screenshot with the contact panel open | `07-soundcloud-sync-contact-panel.webp` |
| Shared footer | One footer mirroring bridge.audio, with a Compare column | `06-footer-5-variants-vs-shared.webp` |
| Cloud Storage Drive vs Bridge demo | Added (labelled Drive illustration vs actual Bridge share page) | `05-cloud-storage-recipient-section.webp` |
| Navigation between the five comparisons | Switcher under the header + footer column, relative links | interaction checks |
| English-only | Done | text scan |

Found and fixed during QA: a template collision that had replaced the Cloud Storage feature table with the Drive illustration rows (caught at 320 px); invisible secondary button in the Cloud Storage dark CTA; fine-print greys below 4.5:1 contrast (84 declarations moved to `#6b7079`).

## Not verified / limitations

- Real devices, Safari/iOS and Firefox were not tested (Chromium only).
- The live GitHub Pages preview of this branch does not exist until it is pushed and published.
- Screen reader pass (VoiceOver/NVDA) not performed; checks were structural (landmarks, labels, focus order).
- bridge.audio footer *styling* could not be rendered; the shared footer reuses the header's tokens.
