# Bridge Label Directory V28 | GitHub preview

This folder is a **multipage design prototype**, NOT a live Bridge.audio directory.

## Preview

Open `index.html` or serve the folder locally using:

```bash
python3 -m http.server 8000
```

If the repository publishes GitHub Pages from `main` at the repository root, the preview URL is expected to be:

`https://clementsouchier-stack.github.io/bridge-tools/directory-v2/`

The public preview is deliberately **noindex,nofollow** because the dataset includes illustrative or unverified records. Do not remove these tags merely to index the GitHub Pages preview.

## Source and checks

- `index.html`, `labels.html`, `label-*.html`, `for-*.html`, `in-*.html`: crawlable preview HTML, directly linked.
- `assets/`: styles, search code and approved prototype images.
- `content/labels.json`: dated, small prototype dataset, not a production database.
- `src/`: source CSS/JS.
- `scripts/build.py`: multipage generator and guarded production exporter.
- `tests/`: structural, SEO and publication-security regression tests.
- `qa/`: textual test evidence.
- `AUDIT-V28.md` and `SEO-AI-RELEASE.md`: detailed audit and production SEO guidance.

Regenerate the preview from this folder:

```bash
python3 scripts/build.py --mode preview --output .
python3 -m unittest discover -s tests -q
```

For validated production deployment, use a **separate approved data file** and a clean output directory. The generator produces canonicals, structured data, sitemap and production routes using the configured Bridge origin, but this must be reconciled with the actual Bridge router (GitLab) and deployed under the main Bridge domain, not GitHub Pages. Example:

```bash
python3 scripts/build.py --mode production \
  --data /path/to/approved-labels.json \
  --origin https://www.bridge.audio \
  --output /path/to/new-empty-output
```

Production remains blocked until catalogue facts, submission statuses, image rights, canonical routes, design tokens and metrics have been validated against their live owners.

## Search visibility

GitHub Pages can be useful as a public preview. It should **not** be the final SEO host for Bridge. Do not add an indexable preview sitemap, unverified JSON-LD or a `robots.txt` inside this nested directory as though it controlled the domain root. See `SEO-AI-RELEASE.md` and `GITHUB-DEPLOY-NOTES.md`.
