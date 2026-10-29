"""Load product definitions from products/<id>/product.yaml."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import yaml


class RegistryError(Exception):
    """A product definition is missing or cannot be parsed."""


def product_file(products_dir: Path, product_id: str) -> Path:
    return products_dir / product_id / "product.yaml"


def load_product(path: Path) -> dict:
    if not path.is_file():
        raise RegistryError(f"No product definition at {path}")
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        raise RegistryError(f"{path}: invalid YAML: {exc}") from exc
    if not isinstance(data, dict) or not isinstance(data.get("product"), dict):
        raise RegistryError(f"{path}: a top-level 'product' mapping is required")
    return data


def list_product_ids(products_dir: Path) -> list[str]:
    return sorted(path.parent.name for path in products_dir.glob("*/product.yaml"))


def load_catalog(store_dir: Path) -> dict:
    """Read the storefront catalog (api/_lib/catalog.js) from a snowStore checkout."""
    catalog_js = store_dir / "api" / "_lib" / "catalog.js"
    if not catalog_js.is_file():
        raise RegistryError(f"No storefront catalog at {catalog_js}")
    try:
        result = subprocess.run(
            ["node", "-p", f"JSON.stringify(require({json.dumps(str(catalog_js))}))"],
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as exc:
        raise RegistryError("node is required to read the storefront catalog") from exc
    if result.returncode != 0:
        raise RegistryError(f"Could not read {catalog_js}: {result.stderr.strip()}")
    return json.loads(result.stdout)


def resolve_product(data: dict, catalog: dict | None) -> dict:
    """Fill a docs entry from the storefront catalog when it names a catalog_id.

    The catalog supplies the name, version, blurb (as description) and the Stripe
    product link. The docs entry supplies everything else and wins on conflicts,
    so features and limitations are always written by a person.
    """
    product = data["product"]
    catalog_id = product.get("catalog_id")
    if catalog_id is None:
        return data
    if catalog is None:
        raise RegistryError(f"{product.get('id')} uses catalog_id '{catalog_id}': pass --store")
    entry = catalog.get(catalog_id)
    if entry is None or "name" not in entry:
        raise RegistryError(f"storefront catalog has no product '{catalog_id}'")

    merged = {
        "name": entry["name"],
        "version": entry.get("version"),
        "description": entry.get("blurb"),
    }
    merged = {key: value for key, value in merged.items() if value is not None}
    merged.update(product)

    billing = dict(product.get("billing") or {})
    if "plans" not in billing and entry.get("stripeProduct"):
        billing["plans"] = [
            {
                "name": "Current pricing",
                "stripe_product": entry["stripeProduct"],
                "stripe_price_id": None,
            }
        ]
    if billing:
        merged["billing"] = {"provider": "stripe", "pricing_source": "stripe", **billing}
    return {"product": merged}
