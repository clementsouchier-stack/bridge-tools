#!/usr/bin/env python3
"""Stamp the shared Bridge Compare header and footer into every page.

The five Compare pages are static HTML (no build step on GitHub Pages).
To keep one source of truth, the shared markup lives in compare/_partials/
and is copied between marker comments in each page:

    <!-- bc:header:start --> ... <!-- bc:header:end -->
    <!-- bc:footer:start --> ... <!-- bc:footer:end -->

The current page is marked with aria-current="page" in the compare
switcher and in the footer's Compare column.

Usage (from the repository root or anywhere):
    python3 compare/_tools/apply_shell.py          # rewrite pages
    python3 compare/_tools/apply_shell.py --check  # exit 1 if a page is stale

Folders starting with "_" are not published by GitHub Pages (Jekyll).
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
PAGES = [
    "alternative-to-disco",
    "alternative-to-untitled",
    "alternative-to-wetransfer",
    "alternative-to-soundcloud",
    "alternative-to-dropbox-google-drive",
]
BLOCKS = {
    "header": (ROOT / "_partials" / "header.html").read_text(encoding="utf-8").strip(),
    "footer": (ROOT / "_partials" / "footer.html").read_text(encoding="utf-8").strip(),
}


def render(block: str, page: str) -> str:
    # Mark the current page wherever the partial lists it.
    return re.sub(
        rf'data-page="{re.escape(page)}"',
        f'aria-current="page" data-page="{page}"',
        block,
    )


def apply(page: str) -> tuple[str, str]:
    path = ROOT / page / "index.html"
    html = path.read_text(encoding="utf-8")
    new = html
    for name, block in BLOCKS.items():
        pattern = re.compile(rf"(<!-- bc:{name}:start -->).*?(<!-- bc:{name}:end -->)", re.S)
        if not pattern.search(new):
            raise SystemExit(f"{path}: missing bc:{name} markers")
        new = pattern.sub(lambda m: f"{m.group(1)}\n{render(block, page)}\n{m.group(2)}", new, count=1)
    return html, new


def main() -> int:
    check = "--check" in sys.argv
    stale = []
    for page in PAGES:
        old, new = apply(page)
        if old != new:
            stale.append(page)
            if not check:
                (ROOT / page / "index.html").write_text(new, encoding="utf-8")
    if check and stale:
        print("Out of date:", ", ".join(stale))
        return 1
    print(("Up to date" if check else "Updated") + (": " + ", ".join(stale) if stale else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
