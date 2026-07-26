import io
import re
from typing import List, Tuple, Optional
import pdfplumber
import fitz  # pymupdf
from app.utils.logger import logger


class PDFParser:
    """Extracts text and page numbers from PDFs using pdfplumber + pymupdf fallback."""

    def extract_pages(self, pdf_bytes: bytes) -> List[Tuple[int, str]]:
        """
        Returns list of (page_number, text) tuples.
        Tries pdfplumber first; falls back to pymupdf for scanned/complex PDFs.
        """
        pages = self._extract_with_pdfplumber(pdf_bytes)

        # If pdfplumber got very little text, try pymupdf
        total_text = sum(len(t) for _, t in pages)
        if total_text < 100 and pages:
            logger.info("pdfplumber got minimal text, trying pymupdf fallback")
            pages = self._extract_with_pymupdf(pdf_bytes)

        return pages

    def _extract_with_pdfplumber(self, pdf_bytes: bytes) -> List[Tuple[int, str]]:
        pages = []
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for i, page in enumerate(pdf.pages, start=1):
                    text = page.extract_text() or ""
                    text = self._clean_text(text)
                    pages.append((i, text))
        except Exception as e:
            logger.warning("pdfplumber extraction failed", error=str(e))
        return pages

    def _extract_with_pymupdf(self, pdf_bytes: bytes) -> List[Tuple[int, str]]:
        pages = []
        try:
            with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
                for i, page in enumerate(doc, start=1):
                    text = page.get_text("text") or ""
                    text = self._clean_text(text)
                    pages.append((i, text))
        except Exception as e:
            logger.warning("pymupdf extraction failed", error=str(e))
        return pages

    def _clean_text(self, text: str) -> str:
        # Remove excessive whitespace and null bytes
        text = text.replace("\x00", "")
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r" {3,}", " ", text)
        return text.strip()

    def get_page_count(self, pdf_bytes: bytes) -> int:
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                return len(pdf.pages)
        except Exception:
            try:
                with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
                    return len(doc)
            except Exception:
                return 0

    def validate_pdf(self, pdf_bytes: bytes) -> Tuple[bool, str]:
        """Returns (is_valid, error_message)."""
        if len(pdf_bytes) == 0:
            return False, "PDF file is empty"

        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                if len(pdf.pages) == 0:
                    return False, "PDF has no pages"
            return True, ""
        except Exception as e:
            return False, f"Invalid or corrupt PDF: {str(e)}"
