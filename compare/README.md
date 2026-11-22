# Bridge.audio | Comparison pages

Five approved, standalone HTML comparison prototypes for internal review. **These files are not evidence of production availability or an approved public launch.**

## Pages

| Directory | Comparison | HTML language | Canonical tag present | Status |
| --- | --- | --- | --- | --- |
| `disco/` | Bridge vs DISCO | English (`en`) | Yes | Approved prototype |
| `untitled/` | Bridge vs Untitled | English (`en`) | No | Approved prototype |
| `wetransfer/` | Bridge vs WeTransfer | French (`fr`) | No | Approved prototype |
| `soundcloud/` | Bridge vs SoundCloud | English (`en`) | Yes | Approved prototype |
| `cloud-storage/` | Bridge vs Google Drive, Dropbox and Box | French (`fr`) | No | Approved prototype |

Every directory has its own `index.html`. `cloud-storage/` also contains six local PNG assets used by that page. Keep these paths relative to their page.

## Review and publishing

- The approved HTML and PNG files are kept byte-for-byte unchanged. Do not reformat, minify, translate or extract their inline CSS/JS as part of repository import.
- All five HTML pages currently declare `noindex,nofollow`. This is appropriate for review prototypes, **not** a production SEO launch. A `noindex` directive does not make a public GitHub repository private.
- The language split (3 English, 2 French) is intentional in this snapshot, not proof of a final localization strategy.
- Canonical tags are inconsistent across pages. Review the intended canonical URLs and metadata before any public website deployment; do not normalize them silently.
- Do not assume GitHub hosting, GitHub Pages or bridge.audio deployment is configured by placing files here.
- Recommended publication workflow: create a dedicated branch (for example `review/compare-pages`), add all files together, review the diff, then open one pull request to `main`. Do not merge or deploy without explicit approval.
- Check local links, mobile layouts, console errors, accessibility, loading performance and all external dependencies in a browser before deployment.
- Before making the repository public or deploying, review embedded scripts, URLs, and assets for sensitive information. Never commit tokens, secrets, signed URLs or credentials.

## Integrity

The SHA-256 checksums below cover the exact HTML and PNG bytes included in this package. Use them to verify uploads without modifying approved prototypes.

```text
8ebd973ed3bd058580cb1c130b2b7f241b659b2e7ab220346274b69c5066f693  compare/cloud-storage/comparison-1440.png
99409af2785801c486a874caaeeaa4f783c7c21ef5a4bc3e6a94dbbf678f7bb1  compare/cloud-storage/comparison-390.png
063ebd3eafaf3cabbd953a5be2edf57ab23e9fcdb23788eb7eb3464dc6e80aa8  compare/cloud-storage/index.html
cb64c77d86ecce3e7d78adac6080acf4f761af6bbf03b210900c09a520365736  compare/cloud-storage/recipient-1440.png
a21d5bb8b6ebc9a9e389dccc2e88c8825a5cd02a0d357330d72855e0aa3a2164  compare/cloud-storage/recipient-390.png
7bc88a0f581195b688a3a2b1f63b54826da1469a47a120f04e5856ec1648ef7f  compare/cloud-storage/top-1440.png
d0a70d80a9b0c30bb2a36da406c70323fc2257ee5c96d6d8cf655b0e93383bb5  compare/cloud-storage/top-390.png
3ade329d904e0589005827bf8f707be5a17833ea8307e8c22e4ecc149c2ae561  compare/disco/index.html
56c4994448704a1167aa32997113163d468b4df651e0ec318df4deb3d6392623  compare/soundcloud/index.html
23046ff138c3fc0944933b14604014618d0d25e37b7d0c6ceb6e28a735462d7a  compare/untitled/index.html
4fcf2f553c8a3c1ca9722f8b2d2ae2906e9169e547ca4d792c9c3657fb1457a6  compare/wetransfer/index.html
```


## Editorial revision (22 November 2026)

This package makes limited copy-only changes, without changing the HTML structure, CSS, JavaScript, images, or asset paths:

- DISCO: emphasize Bridge's accessibility across music and entertainment roles, not only sync specialists, while keeping pricing and plan conditions explicit.
- [untitled]: acknowledge its strengths in music creation and versioning; clarify that Bridge supports both demos and finished music and connects artists, managers, publishers, producers, and recipients.
- SoundCloud: sharpen the fan-facing vs professional-workflow distinction.
- Cloud Storage: clarify collaboration across music professionals.
- WeTransfer: unchanged, as the existing comparison already conveys the intended distinction.

The layouts have not been redesigned. Text length may affect wrapping at particular viewport widths; perform a browser visual check before publishing.

## Integrity

`SHA256SUMS.txt` lists all packaged HTML and PNG files for verification after uploading to GitHub.
