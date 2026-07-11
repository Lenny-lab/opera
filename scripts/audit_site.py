from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "site"


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.references: list[str] = []
        self.has_title = False
        self.has_description = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(str(values["id"]))
        if tag == "title":
            self.has_title = True
        if tag == "meta" and values.get("name") == "description":
            self.has_description = True
        reference_attribute = {"a": "href", "img": "src", "script": "src", "link": "href", "audio": "src"}.get(tag)
        if reference_attribute and values.get(reference_attribute):
            self.references.append(str(values[reference_attribute]))


def main() -> int:
    errors: list[str] = []
    pages = [ROOT / "index.html", *sorted((ROOT / "pages").rglob("*.html"))]

    for page in pages:
        parser = PageParser()
        parser.feed(page.read_text(encoding="utf-8-sig"))
        duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
        if duplicates:
            errors.append(f"{page.relative_to(ROOT)}: duplicate ids {duplicates}")
        if not parser.has_title or not parser.has_description:
            errors.append(f"{page.relative_to(ROOT)}: missing title or description")

        for value in parser.references:
            if value.startswith(("#", "http:", "https:", "mailto:", "data:")):
                continue
            target = (page.parent / value.split("#")[0].split("?")[0]).resolve()
            if not target.exists():
                errors.append(f"{page.relative_to(ROOT)}: missing {value}")

    url_pattern = re.compile(r"url\([\"']?([^\)\"']+)")
    for css in ROOT.rglob("*.css"):
        for value in url_pattern.findall(css.read_text(encoding="utf-8-sig")):
            if value.startswith(("data:", "http:", "https:")):
                continue
            if not (css.parent / value).resolve().exists():
                errors.append(f"{css.relative_to(ROOT)}: missing {value}")

    for json_file in ROOT.rglob("*.json"):
        json.loads(json_file.read_text(encoding="utf-8-sig"))

    secret_pattern = re.compile(r"sk-[A-Za-z0-9_-]{12,}")
    candidates = [*ROOT.rglob("*"), ROOT.parent / "scripts" / "serve_site.js"]
    for candidate in candidates:
        if candidate.is_file() and candidate.suffix in {".html", ".js", ".json", ".md"}:
            text = candidate.read_text(encoding="utf-8-sig", errors="ignore")
            if secret_pattern.search(text):
                errors.append(f"embedded secret: {candidate}")

    print(f"HTML pages: {len(pages)}")
    print(f"Audit errors: {len(errors)}")
    for error in errors:
        print(f"ERROR {error}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
