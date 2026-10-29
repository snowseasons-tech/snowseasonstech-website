"""PDF output via Pandoc. Requires pandoc and a LaTeX engine on PATH."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


class PdfError(Exception):
    """Pandoc could not produce the PDF."""


def pandoc_available() -> bool:
    return shutil.which("pandoc") is not None


def markdown_to_pdf(md_path: Path, pdf_path: Path) -> None:
    try:
        subprocess.run(
            ["pandoc", str(md_path), "-o", str(pdf_path)],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        raise PdfError(f"pandoc failed for {md_path.name}: {exc.stderr.strip()}") from exc
