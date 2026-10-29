"""Command line entry point: python -m generator --product cdot-stations"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .build import OUTPUT_FORMATS, BuildError, build_product, check_product
from .publish import publish_blockers, publish_product
from .registry import RegistryError, list_product_ids, load_catalog

ROOT = Path(__file__).resolve().parents[1]
FORMAT_CHOICES = {"all": OUTPUT_FORMATS, "docx": ("docx",), "pdf": ("pdf",), "md": ()}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m generator", description=__doc__)
    target = parser.add_mutually_exclusive_group(required=True)
    target.add_argument("--product", help="product id, e.g. cdot-stations")
    target.add_argument("--all", action="store_true", help="every product in products/")
    parser.add_argument("--format", choices=sorted(FORMAT_CHOICES), default="all")
    parser.add_argument("--validate-only", action="store_true", help="check definitions, write nothing")
    parser.add_argument("--products-dir", type=Path, default=ROOT / "products")
    parser.add_argument("--templates-dir", type=Path, default=ROOT / "templates")
    parser.add_argument("--out", type=Path, default=ROOT / "build")
    parser.add_argument(
        "--store",
        type=Path,
        help="path to a snowStore checkout; fills entries that set catalog_id from its catalog",
    )
    parser.add_argument(
        "--docs-dir",
        type=Path,
        help="Docusaurus docs folder; approved products are synced into it, others are removed",
    )
    args = parser.parse_args(argv)

    product_ids = list_product_ids(args.products_dir) if args.all else [args.product]
    if not product_ids:
        print(f"No products found in {args.products_dir}", file=sys.stderr)
        return 1

    catalog = None
    if args.store:
        try:
            catalog = load_catalog(args.store)
        except RegistryError as exc:
            print(exc, file=sys.stderr)
            return 1

    failed = False
    for product_id in product_ids:
        try:
            if args.validate_only:
                report = check_product(product_id, args.products_dir, catalog)
                if report.ok:
                    print(f"{product_id}: valid")
                else:
                    failed = True
                    print(f"{product_id}: invalid\n  - " + "\n  - ".join(report.errors))
                for warning in report.warnings:
                    print(f"  warning: {warning}")
                continue

            manifest = build_product(
                product_id,
                products_dir=args.products_dir,
                templates_dir=args.templates_dir,
                out_dir=args.out,
                formats=FORMAT_CHOICES[args.format],
                catalog=catalog,
            )
        except (RegistryError, BuildError) as exc:
            failed = True
            print(exc, file=sys.stderr)
            continue

        print(f"{product_id}: built {len(manifest['outputs'])} file(s) in {args.out / product_id}")
        for item in manifest["skipped"]:
            print(f"  skipped {item['file']}: {item['reason']}")
        for warning in manifest["warnings"]:
            print(f"  warning: {warning}")

        if args.docs_dir:
            if publish_product(manifest, args.out / product_id, args.docs_dir):
                print(f"  published to {args.docs_dir / 'products' / product_id}")
            else:
                print(f"  not published: {'; '.join(publish_blockers(manifest))}")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
