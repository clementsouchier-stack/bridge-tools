# Label Directory V28 | UX, accessibility, architecture and release audit

**Review date:** 5 November 2026. **Status:** local preview and development handoff, not a production deployment.

## Design and implementation decisions

1. **No structural redesign.** The V27 layout, Manrope visual language, blue primary CTA (`#2f43de`), hover state (`#1e2f9e`) and 4 px button radius remain the baseline, consistent with supplied historical Bridge UI/CSS. These do **not** prove current Storybook parity.
2. **Keyboard access to submission.** Each profile's persistent action bar now appears directly after the header in DOM reading/tab order, before the main profile content. An accessible label identifies the destination and new-tab behavior. This fixes an important discrepancy between visual prominence and keyboard access.
3. **Reduced mobile overlay.** On screens up to 560 px, the fixed action bar shows the CTA/unavailable state only, without redundant title and explanatory line. Body/footer bottom spacing prevents the last page content from being permanently hidden. On-Bridge profile pages no longer repeat a redundant “Send your music” section.
4. **Tiny-screen polish.** The 320 px header retains both navigation links. The Amsterdam category-arrow clipping found in the visual audit was fixed with an intentional compact layout. Long headings do not create horizontal overflow.
5. **Less redundant filtering.** Directory filters respond instantly; the duplicate “Apply filters” action was removed. Search field, city, genre, On Bridge, clear/reset, sort, zero-results feedback and query-string state remain functional. A `noscript` message describes the limitation of this static preview when JavaScript is disabled.
6. **Better content signals.** Category tiles show actual counts from the current preview dataset, not generic claims. Verification-date text on profiles is derived from each record's `checked_at` field rather than hard-coded “Nov 2026”. The two illustration-only profiles remain separate from public browsing.
7. **More legible controls.** Placeholder text, card arrows, muted unavailable CTA and filtering field borders have stronger contrast. Representative measured ratios: primary white-on-blue **7.05:1**, On Bridge badge **7.45:1**, muted CTA **5.50:1**, placeholder **4.59:1**, form boundary **3.06:1**.

## Verified technical checks

| Coverage | Result | Scope / limitation |
|---|---|---|
| Unit and release regression | **27 / 27 passed** | HTML, links, IDs, data validation, production output and SEO |
| Browser visual/structural matrix | **54 / 54 passed** | 6 page types × 9 widths: 320, 360, 375, 390, 430, 768, 1024, 1440, 1920 px |
| No horizontal overflow | **No failing case** | Defined matrix + one deliberately long mobile H1 |
| Browser JavaScript errors | **None detected** | Local Chromium with inlined preview CSS/assets |
| Missing image assets | **None detected** | Local preview asset set |
| Search and filter flow | **Passed** | Live filtering, independent city/genre filters, On Bridge, reset and zero results |
| Sorting and URL prefill | **Passed** | A–Z, recommended reset, accent-insensitive search and prefilled query |
| Keyboard CTA path | **Passed** | Fixed CTA receives focus immediately following header navigation |
| Build release safety | **Passed** | Unsafe slugs, missing logos, unknown domains, stale dates, duplicate output, unapproved/underfilled category pages |
| SEO export | **Passed** | Canonicals, schema, sitemap, noindex 404 and no accidental category links in sample production fixture |

**Browser test caveat:** Local `file:` and localhost navigation are blocked by the test environment. Browsers were tested with the generated HTML, local CSS/JS and image assets inlined, then functional scenarios were simulated on the page. This validates rendering and UI logic; it **does not** prove HTTP redirects, caching, production delivery, external Inbox completion or real indexing.

## Source and truth audit

Source hierarchy: `00 — BRIDGE — Canonical Sources Protocol`, `04 — BRIDGE — Product Architecture & Current State`, `05 — BRIDGE — Messaging & Brand Bible`, `08 — BRIDGE — Links & Assets Registry`, then live public directory and supplied code. These confirm the role of Inbox, design principles and the operational Storybook URL. The current Storybook URL did not load in the available web tool, so token/component parity remains **unverified**.

Records in the preview are frozen snapshots with source links, not evidence of continuous accuracy:

- Walboomers Music: https://www.bridge.audio/directory/record-label/walboomers-music_w6qykr/
- Beggars: https://www.bridge.audio/directory/record-label/beggars_hh2r0l/
- Delsin Records: https://www.bridge.audio/directory/record-label/delsin-records_rjzwjz/
- Universal Music: https://www.bridge.audio/directory/record-label/universal-music_gdzcrc/
- Sony Music Entertainment: https://www.bridge.audio/directory/record-label/sony-music-entertainment_9j3imd/

The first two are marked On Bridge and have their concrete public Bridge Inbox destinations in the source snapshot. The other three have no direct Inbox in this snapshot; that does not prove they will never accept demos. Headbanger and Franker are explicitly unverified examples.

## Honest design scorecard (expert estimate, not a measured certification)

| Dimension | V27 estimate | V28 estimate | What still prevents a defensible 9.5 certification |
|---|---:|---:|---|
| Visual clarity and hierarchy | 9.2 | **9.3** | Expert review and direct production reference comparison |
| Homepage and discovery | 9.2 | **9.3** | Full-catalog testing and real user trials |
| Profile UX | 9.3 | **9.4** | End-to-end Inbox validation in staging |
| CTA consistency | 9.5 | **9.5** | Backend status/data freshness |
| Responsive layouts | 9.3 | **9.5 in tested scenarios** | Real devices and browsers not covered |
| Accessibility | 8.8 | **9.1** | Screen-reader and comprehensive WCAG audits |
| Design System fidelity | 8.1 | **8.1 (unverified)** | Current Storybook and production component code |
| Frontend architecture | 9.3 | **9.5 (prototype scope)** | Actual deployment platform and CI integration |
| SEO architecture (prepared) | 8.8 | **9.1** | HTTP implementation and Search Console evidence |
| AI discoverability (prepared) | 8.0 | **8.3** | Scaled verified content and observed search/AI referrals |

These are **qualitative assessments**. No organic rankings, LLM citations, Core Web Vitals scores or usability success rates were measured.

## Open gates before shipping

1. Production Design System/Storybook component comparison and real browser/screen-reader QA.
2. Approved full database export, content/photo rights and continuous Inbox status synchronization.
3. Merge into actual production repository, verify current public routes, page responses, 301/404, SSR/SSG delivery and Open Graph artwork.
4. Run Lighthouse, Web Vitals monitoring, structured-data validation and real search crawls on staging.
5. Start with a small approved subset and monitor submissions, indexation, organic search and attributable AI referrals. Do not publish demo profiles.
