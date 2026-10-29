import copy

import pytest
import yaml
from docx import Document

from pathlib import Path

from generator.build import BuildError, build_product, check_product
from generator.registry import load_changelog, load_product, product_file
from generator.renderer import make_environment, render_document
from generator.validation import validate_changelog

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / "products"
TEMPLATES = ROOT / "templates"

RELEASES = [
    {
        "version": "0.1.1",
        "date": "2026-11-02",
        "added": [],
        "changed": ["Clearer station search results"],
        "fixed": ["Dashboard loads after sign-in"],
    },
    {
        "version": "0.1.0",
        "date": "2026-10-29",
        "added": ["Station dashboard"],
        "changed": [],
        "fixed": [],
    },
]


def product_with_release_notes():
    data = load_product(product_file(PRODUCTS, "cdot-stations"))
    data["product"]["documentation"]["generate"].append("release_notes")
    data["product"]["version"] = "0.1.1"
    return copy.deepcopy(data)


def changelog(releases=None):
    return {"releases": copy.deepcopy(releases if releases is not None else RELEASES)}


def test_valid_changelog_has_no_errors():
    assert validate_changelog(changelog(), product_with_release_notes()["product"]) == []


def test_missing_changelog_is_an_error():
    errors = validate_changelog(None, product_with_release_notes()["product"])
    assert errors == ["release_notes needs products/<id>/changelog.yaml"]


def test_newest_release_must_match_product_version():
    product = product_with_release_notes()["product"]
    product["version"] = "0.2.0"
    errors = validate_changelog(changelog(), product)
    assert any("does not match product.version" in error for error in errors)


def test_release_needs_a_change_and_a_valid_date():
    releases = copy.deepcopy(RELEASES)
    releases[0]["changed"] = []
    releases[0]["fixed"] = []
    releases[0]["date"] = "2026/11/02"
    errors = validate_changelog(changelog(releases), product_with_release_notes()["product"])
    assert "0.1.1: list at least one change" in errors
    assert "0.1.1: date must be YYYY-MM-DD" in errors


def test_duplicate_versions_are_rejected():
    releases = copy.deepcopy(RELEASES)
    releases[1]["version"] = "0.1.1"
    errors = validate_changelog(changelog(releases), product_with_release_notes()["product"])
    assert "0.1.1: duplicate version" in errors


def test_render_lists_each_release_and_skips_empty_sections():
    product = product_with_release_notes()["product"]
    text = render_document(make_environment(TEMPLATES), "release_notes", product, releases=RELEASES)
    assert "## Version 0.1.1 (2026-11-02)" in text
    assert "### Changed\n\n- Clearer station search results" in text
    assert "### Added\n\n- Station dashboard" in text
    assert text.count("### Added") == 1
    assert "### Fixed\n\n- Dashboard loads after sign-in" in text


def write_product(products_dir, data, releases=None):
    product_dir = products_dir / data["product"]["id"]
    product_dir.mkdir(parents=True)
    (product_dir / "product.yaml").write_text(yaml.safe_dump(data), encoding="utf-8")
    if releases is not None:
        (product_dir / "changelog.yaml").write_text(yaml.safe_dump({"releases": releases}), encoding="utf-8")


def test_build_writes_release_notes_docx(tmp_path):
    products = tmp_path / "products"
    data = product_with_release_notes()
    write_product(products, data, RELEASES)
    build_product(
        "cdot-stations",
        products_dir=products,
        templates_dir=TEMPLATES,
        out_dir=tmp_path / "out",
        formats=("docx",),
    )
    target = tmp_path / "out" / "cdot-stations"
    assert "## Version 0.1.1 (2026-11-02)" in (target / "release-notes.md").read_text(encoding="utf-8")
    headings = [paragraph.text for paragraph in Document(target / "release-notes.docx").paragraphs]
    assert "Version 0.1.1 (2026-11-02)" in headings


def test_build_refuses_release_notes_without_changelog(tmp_path):
    products = tmp_path / "products"
    write_product(products, product_with_release_notes(), releases=None)
    with pytest.raises(BuildError, match="changelog.yaml"):
        build_product(
            "cdot-stations",
            products_dir=products,
            templates_dir=TEMPLATES,
            out_dir=tmp_path / "out",
        )


def test_check_reports_changelog_problems(tmp_path):
    products = tmp_path / "products"
    bad = copy.deepcopy(RELEASES)
    bad[0]["version"] = "0.9.0"
    write_product(products, product_with_release_notes(), bad)
    report = check_product("cdot-stations", products)
    assert not report.ok
    assert any("does not match product.version" in error for error in report.errors)


def test_load_changelog_returns_none_when_absent(tmp_path):
    assert load_changelog(tmp_path, "cdot-stations") is None
