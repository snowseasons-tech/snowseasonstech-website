import json

from generator.__main__ import main
from generator.publish import publish_blockers, publish_product


def manifest(**overrides):
    base = {
        "product": "demo",
        "name": "Demo Product",
        "status": "generally_available",
        "features_confirmed": True,
        "outputs": [
            {"file": "product-overview.md", "format": "md"},
            {"file": "product-overview.docx", "format": "docx"},
        ],
    }
    base.update(overrides)
    return base


def build_dir(tmp_path):
    build = tmp_path / "build"
    build.mkdir()
    (build / "product-overview.md").write_text("# Demo\n", encoding="utf-8")
    (build / "product-overview.docx").write_bytes(b"not copied")
    return build


def test_draft_and_unconfirmed_products_are_blocked():
    assert publish_blockers(manifest(status="draft")) == ["status is draft"]
    assert publish_blockers(manifest(features_confirmed=False)) == [
        "features are not confirmed by the product owner"
    ]
    assert publish_blockers(manifest()) == []


def test_publish_copies_markdown_and_writes_category(tmp_path):
    docs = tmp_path / "docs"
    assert publish_product(manifest(), build_dir(tmp_path), docs) is True

    target = docs / "products" / "demo"
    assert (target / "product-overview.md").read_text(encoding="utf-8") == "# Demo\n"
    assert not (target / "product-overview.docx").exists()
    category = json.loads((target / "_category_.json").read_text(encoding="utf-8"))
    assert category["label"] == "Demo Product"


def test_blocked_product_is_removed_from_site(tmp_path):
    docs = tmp_path / "docs"
    target = docs / "products" / "demo"
    target.mkdir(parents=True)
    (target / "old.md").write_text("stale", encoding="utf-8")

    assert publish_product(manifest(features_confirmed=False), build_dir(tmp_path), docs) is False
    assert not target.exists()


def test_cli_does_not_publish_unconfirmed_pilot(tmp_path):
    docs = tmp_path / "docs"
    code = main(
        [
            "--product",
            "cdot-stations",
            "--format",
            "docx",
            "--out",
            str(tmp_path / "out"),
            "--docs-dir",
            str(docs),
        ]
    )
    assert code == 0
    assert not (docs / "products" / "cdot-stations").exists()
