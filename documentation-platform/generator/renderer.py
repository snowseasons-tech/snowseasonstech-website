"""Render Jinja2 templates into Markdown documents."""

from __future__ import annotations

from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined

# document type -> (template file, output file stem)
DOC_TEMPLATES = {
    "product_overview": ("product-overview.md.j2", "product-overview"),
    "getting_started": ("getting-started.md.j2", "getting-started"),
    "pricing_sheet": ("pricing-sheet.md.j2", "pricing-sheet"),
}


def make_environment(templates_dir: Path) -> Environment:
    env = Environment(
        loader=FileSystemLoader(str(templates_dir)),
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
        keep_trailing_newline=True,
        autoescape=False,
    )
    env.filters["humanize"] = lambda value: str(value).replace("_", " ").capitalize()
    return env


def render_document(env: Environment, doc_type: str, product: dict) -> str:
    template_name, _ = DOC_TEMPLATES[doc_type]
    return env.get_template(template_name).render(product=product)
