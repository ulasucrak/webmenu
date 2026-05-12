"""
Scrape Niyokki Elazığ (or any webmenu.pardonapp.co branch) from embedded __NEXT_DATA__.

Usage:
  python scrape_pardon_menu.py --branch-url https://webmenu.pardonapp.co/tr/niyokki-elazig
  python scrape_pardon_menu.py --branch-url https://webmenu.pardonapp.co/en/niyokki-elazig

Outputs: pardon_menu_{slug}_{locale}.json / .csv (locale from URL or page, e.g. tr, en).
"""

from __future__ import annotations

import argparse
import csv
import html as html_lib
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

NEXT_DATA_RE = re.compile(
    r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>',
    re.DOTALL,
)


def fetch(url: str, *, timeout: float = 90.0, retries: int = 4) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    last_err: BaseException | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last_err = e
            if attempt + 1 < retries:
                time.sleep(1.5 * (attempt + 1))
            continue
    assert last_err is not None
    raise last_err


def parse_next_data(html_doc: str) -> dict:
    m = NEXT_DATA_RE.search(html_doc)
    if not m:
        raise ValueError("No __NEXT_DATA__ JSON found in page")
    return json.loads(m.group(1))


def strip_html(text: str | None) -> str:
    if not text:
        return ""
    plain = re.sub(r"<[^>]+>", " ", text)
    plain = html_lib.unescape(plain)
    return re.sub(r"\s+", " ", plain).strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--branch-url",
        default="https://webmenu.pardonapp.co/tr/niyokki-elazig",
        help="Branch landing URL; use /tr/ or /en/ before the slug (e.g. replace en with tr)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.35,
        help="Seconds between category requests",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path(__file__).resolve().parent,
    )
    args = parser.parse_args()

    base = args.branch_url.rstrip("/")
    print(f"Fetching branch page: {base}", file=sys.stderr)
    landing_html = fetch(base)
    nd = parse_next_data(landing_html)
    initial = nd["props"]["pageProps"]["initialState"]
    page_locale = (nd.get("locale") or "unknown").lower()

    categories = (initial.get("branches") or {}).get("categories") or []
    if not categories:
        raise SystemExit("No categories found on branch page")

    branch_id = categories[0].get("BranchId")
    locale_prefix = ""
    m_loc = re.search(r"webmenu\.pardonapp\.co/(tr|en)(?:/|$)", base)
    if m_loc:
        locale_prefix = f"/{m_loc.group(1)}"

    short = base.split("webmenu.pardonapp.co")[-1].rstrip("/")
    short_parts = [p for p in short.split("/") if p and p not in ("tr", "en", "de")]
    branch_slug = short_parts[0] if short_parts else "branch"

    rows: list[dict] = []

    for cat in sorted(categories, key=lambda c: (c.get("Rank") or 0, c["Id"])):
        cid = cat["Id"]
        cat_title = cat["Title"]
        menu_url = f"https://webmenu.pardonapp.co{locale_prefix}/{branch_slug}/{branch_id}/menu/{cid}"
        print(f"  category {cid}: {cat_title}", file=sys.stderr)
        try:
            page_html = fetch(menu_url)
        except Exception as e:
            print(f"    FAIL {menu_url}: {e}", file=sys.stderr)
            continue

        try:
            page_nd = parse_next_data(page_html)
        except ValueError:
            print(f"    No JSON for {menu_url}", file=sys.stderr)
            continue

        prod_state = page_nd["props"]["pageProps"]["initialState"]["products"]
        buckets = prod_state.get("allProducts") or []

        for bucket in buckets:
            sub_title = bucket.get("Title") or ""
            for p in bucket.get("ProductList") or []:
                price = p.get("DiscountPrice")
                if price is None:
                    price = p.get("Price")
                currency = strip_html(p.get("CurrencyTitle") or "")
                rows.append(
                    {
                        "category_id": cid,
                        "category_title": cat_title,
                        "subcategory_title": sub_title,
                        "product_id": p.get("Id"),
                        "product_title": p.get("Title"),
                        "price": price,
                        "currency": currency or "TRY",
                        "description_plain": strip_html(p.get("Description")),
                        "description_html": (p.get("Description") or "").strip(),
                        "image_url": p.get("Image"),
                        "product_url": menu_url,
                    }
                )

        time.sleep(args.delay)

    out_dir = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / f"pardon_menu_{branch_slug}_{page_locale}.json"
    csv_path = out_dir / f"pardon_menu_{branch_slug}_{page_locale}.csv"

    with json_path.open("w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    if rows:
        with csv_path.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)

    print(f"Wrote {len(rows)} products to {json_path}")
    print(f"Wrote CSV to {csv_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
