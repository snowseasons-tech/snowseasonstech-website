"""Copy built Markdown into the Docusaurus site, but only for approved products.

A product is published when its features are confirmed by the product owner and
its status is not draft. Any other product has its docs removed from the site,
so a product that goes back to draft disappears from the site on the next build.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

PRODUCTS_SUBDIR = "products"


def publish_blockers(manifest: dict) -> list[str]:
    blockers = []
    if manifest["status"] == "draft":
        blockers.append("status is draft")
    if not manifest["features_confirmed"]:
        blockers.append("features are not confirmed by the product owner")
    return blockers


def publish_product(manifest: dict, build_dir: Path, docs_dir: Path) -> bool:
    """Sync one product's Markdown into docs_dir. Return True if it was published."""
    target = docs_dir / PRODUCTS_SUBDIR / manifest["product"]
    if target.exists():
        shutil.rmtree(target)
    if publish_blockers(manifest):
        return False

    target.mkdir(parents=True)
    for output in manifest["outputs"]:
        if output["format"] == "md":
            shutil.copy2(build_dir / output["file"], target / output["file"])
    category = {
        "label": manifest["name"],
        "link": {"type": "generated-index"},
    }
    (target / "_category_.json").write_text(json.dumps(category, indent=2) + "\n", encoding="utf-8")
    return True
