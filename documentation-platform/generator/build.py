"""Validate a product, render its documents, and write a manifest."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from . import docx_export, pdf_export
from .registry import load_product, product_file, resolve_product
from .renderer import DOC_TEMPLATES, make_environment, render_document
from .validation import Report, validate_product, validate_rendered

OUTPUT_FORMATS = ("docx", "pdf")


class BuildError(Exception):
    """The product cannot be built until its problems are fixed."""


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _output(path: Path, fmt: str) -> dict:
    return {
        "file": path.name,
        "format": fmt,
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
    }


def check_product(product_id: str, products_dir: Path, catalog: dict | None = None) -> Report:
    data = resolve_product(load_product(product_file(products_dir, product_id)), catalog)
    return validate_product(data)


def build_product(
    product_id: str,
    *,
    products_dir: Path,
    templates_dir: Path,
    out_dir: Path,
    formats: tuple[str, ...] = OUTPUT_FORMATS,
    catalog: dict | None = None,
) -> dict:
    path = product_file(products_dir, product_id)
    data = resolve_product(load_product(path), catalog)
    report = validate_product(data)
    if not report.ok:
        problems = "\n  - ".join(report.errors)
        raise BuildError(f"{product_id} failed validation:\n  - {problems}")

    product = data["product"]
    env = make_environment(templates_dir)
    target = out_dir / product_id
    target.mkdir(parents=True, exist_ok=True)

    outputs: list[dict] = []
    skipped: list[dict] = []
    template_hashes: dict[str, str] = {}

    for doc_type in product["documentation"]["generate"]:
        template_name, stem = DOC_TEMPLATES[doc_type]
        template_hashes[template_name] = sha256(templates_dir / template_name)

        markdown = render_document(env, doc_type, product)
        problems = validate_rendered(markdown)
        if problems:
            raise BuildError(f"{stem} has unfilled content:\n  - " + "\n  - ".join(problems))

        md_path = target / f"{stem}.md"
        md_path.write_text(markdown, encoding="utf-8")
        outputs.append(_output(md_path, "md"))

        if "docx" in formats:
            docx_path = target / f"{stem}.docx"
            docx_export.markdown_to_docx(markdown, docx_path)
            outputs.append(_output(docx_path, "docx"))

        if "pdf" in formats:
            pdf_path = target / f"{stem}.pdf"
            if pdf_export.pandoc_available():
                pdf_export.markdown_to_pdf(md_path, pdf_path)
                outputs.append(_output(pdf_path, "pdf"))
            else:
                skipped.append({"file": pdf_path.name, "reason": "pandoc is not installed"})

    manifest = {
        "product": product["id"],
        "version": str(product["version"]),
        "status": product["status"],
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": {
            "product_yaml_sha256": sha256(path),
            "templates": template_hashes,
        },
        "warnings": report.warnings,
        "outputs": outputs,
        "skipped": skipped,
    }
    (target / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest
