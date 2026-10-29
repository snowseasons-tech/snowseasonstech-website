"""Checks run before any document is generated or published."""

from __future__ import annotations

import re
from dataclasses import dataclass, field

STATUSES = {
    "draft",
    "mvp",
    "early_access",
    "beta",
    "generally_available",
    "retired",
}
PRE_RELEASE = {"mvp", "early_access", "beta"}
DOC_TYPES = {"product_overview", "getting_started", "pricing_sheet"}
SUPPORT_LEVELS = {"basic", "standard", "priority"}

SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SEMVER = re.compile(r"^\d+\.\d+\.\d+$")
IDENTIFIER = re.compile(r"^[a-z0-9_]+$")
PLACEHOLDER = re.compile(r"\bTODO\b|\bTBD\b|\{\{|\}\}|\{%|%\}")


@dataclass
class Report:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


def _filled(value: object) -> bool:
    return isinstance(value, str) and value.strip() != ""


def validate_product(data: dict) -> Report:
    report = Report()
    err = report.errors.append
    warn = report.warnings.append
    product = data.get("product") or {}

    for key in ("id", "name", "company", "description", "status"):
        if not _filled(product.get(key)):
            err(f"product.{key} is required")

    product_id = product.get("id")
    if _filled(product_id) and not SLUG.match(product_id):
        err(f"product.id '{product_id}' must be lowercase letters, digits and hyphens")

    version = str(product.get("version", ""))
    if not SEMVER.match(version):
        err(f"product.version must be quoted semver like \"0.1.0\", got '{version}'")

    status = product.get("status")
    if status not in STATUSES:
        err(f"product.status must be one of: {', '.join(sorted(STATUSES))}")
    elif status == "draft":
        warn("product.status is draft: review before publishing")

    features = product.get("features")
    if not isinstance(features, list) or not features or not all(_filled(f) for f in features):
        err("product.features must be a non-empty list of text items")
    elif len(set(features)) != len(features):
        err("product.features contains duplicates")

    if product.get("features_confirmed") is not True:
        warn("product.features_confirmed is not true: the product owner must confirm the feature list")

    limitations = product.get("known_limitations") or []
    if status in PRE_RELEASE and not limitations:
        warn(f"status '{status}' should list known_limitations")

    docs = product.get("documentation") or {}
    generate = docs.get("generate")
    if not isinstance(generate, list) or not generate:
        err("product.documentation.generate must list at least one document")
        generate = []
    for doc in generate:
        if not isinstance(doc, str) or doc not in DOC_TYPES:
            err(f"unsupported document type '{doc}'; supported: {', '.join(sorted(DOC_TYPES))}")

    billing = product.get("billing") or {}
    if billing.get("provider") != "stripe":
        err("product.billing.provider must be 'stripe'")
    if billing.get("pricing_source") != "stripe":
        err("product.billing.pricing_source must be 'stripe': Stripe is the price authority")

    plans = billing.get("plans") or []
    if "pricing_sheet" in generate and not plans:
        err("pricing_sheet requires at least one entry in product.billing.plans")
    for plan in plans:
        if not isinstance(plan, dict) or not _filled(plan.get("name")):
            err("every billing plan needs a name")
            continue
        if plan.get("stripe_price_id") is None:
            warn(f"plan '{plan['name']}' has no stripe_price_id yet")

    access = product.get("access") or {}
    if not isinstance(access.get("authentication_required"), bool):
        err("product.access.authentication_required must be true or false")
    entitlement = access.get("entitlement")
    if not _filled(entitlement) or not IDENTIFIER.match(entitlement):
        err("product.access.entitlement must be a snake_case identifier")

    support = product.get("support") or {}
    if support.get("level") not in SUPPORT_LEVELS:
        err(f"product.support.level must be one of: {', '.join(sorted(SUPPORT_LEVELS))}")

    return report


def validate_rendered(text: str) -> list[str]:
    """Return a problem for each unfilled template marker left in rendered output."""
    return [
        f"line {number}: unfilled marker '{match.group(0)}'"
        for number, line in enumerate(text.splitlines(), start=1)
        for match in PLACEHOLDER.finditer(line)
    ]
