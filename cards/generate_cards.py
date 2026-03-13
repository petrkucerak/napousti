"""Generate printable card sheets from a JSON dataset.

Usage:
    python generate_cards.py path/to/dataset.json

The script produces a single PDF with:
  - front side: cards with icon/title/description/footer
  - back side: cards with a number (1..6) distributed evenly and randomized

Layout:
  - A4 landscape, 2 rows x 4 columns (8 cards per page)
  - Crop marks are drawn for easy cutting

Recommended dependencies:
  pip install reportlab svglib pillow

If you don't have a TTF font available on your system, the script will fall back to the default PDF font.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import random
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas

try:
    # svglib can render SVG to ReportLab drawings
    from reportlab.graphics import renderPDF
    from svglib.svglib import svg2rlg
except ImportError:  # pragma: no cover
    svg2rlg = None  # type: ignore
    renderPDF = None  # type: ignore


@dataclass
class CardData:
    title: str
    note: str
    icon_path: Optional[Path]


def find_font() -> Optional[Path]:
    """Try to locate a font that supports Czech characters."""
    candidates = [
        # Common Linux
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        # macOS
        "/Library/Fonts/Arial Unicode.ttf",
        "/Library/Fonts/Arial.ttf",
        # Windows
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/DejaVuSans.ttf",
        # Common fallback
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]

    for path in candidates:
        if Path(path).exists():
            return Path(path)

    return None


def register_font(name: str = "DejaVuSans") -> str:
    """Register a TTF font if available, otherwise use default."""
    font_path = find_font()
    if font_path:
        try:
            pdfmetrics.registerFont(TTFont(name, str(font_path)))
            return name
        except Exception:
            # fall back to default
            pass

    # Fall back to the built-in font which may not support Czech
    return "Helvetica"


def load_cards_from_dataset(dataset_path: Path) -> Tuple[str, str, str, List[CardData]]:
    """Load the dataset JSON and return cards with absolute icon paths."""
    data = json.loads(dataset_path.read_text(encoding="utf-8"))
    set_name = data.get("setName", "Cards")
    set_version = data.get("setVersion", "")
    footer_text = data.get("footerText", "")

    base_dir = dataset_path.parent
    cards: List[CardData] = []

    for category in data.get("data", []):
        icon_value = category.get("icon")
        icon_path = None
        if isinstance(icon_value, str) and icon_value.strip():
            candidate = base_dir / icon_value
            if not candidate.exists():
                # Support dataset paths that are relative to repository root
                repo_root = dataset_path.parents[2] if len(dataset_path.parents) > 2 else dataset_path.parent
                candidate = repo_root / icon_value
            icon_path = candidate.resolve() if candidate.exists() else None

        for card in category.get("cards", []):
            title = str(card.get("title", "")).strip()
            note = str(card.get("note", "")).strip()
            cards.append(CardData(title=title, note=note, icon_path=icon_path))

    return set_name, set_version, footer_text, cards


def ensure_card_count(cards: List[CardData]) -> List[CardData]:
    """Ensure total cards is a multiple of 8 (sheet) and 6 (number distribution)."""
    # Ensure full pages (8 cards per page)
    per_page = 8
    total = len(cards)
    pages = math.ceil(total / per_page)
    need = pages * per_page
    while len(cards) < need:
        cards.append(CardData(title="", note="", icon_path=None))

    # Ensure numbers can be evenly distributed across 1..6
    total = len(cards)
    if total % 6 != 0:
        extra = 6 - (total % 6)
        for _ in range(extra):
            cards.append(CardData(title="", note="", icon_path=None))
    return cards


def _draw_crop_marks(c: Canvas, x: float, y: float, w: float, h: float, mark_len: float = 5 * mm) -> None:
    """Draw crop marks around a single card."""
    # Top-left
    c.line(x, y + h, x, y + h + mark_len)
    c.line(x, y + h, x - mark_len, y + h)
    # Top-right
    c.line(x + w, y + h, x + w, y + h + mark_len)
    c.line(x + w, y + h, x + w + mark_len, y + h)
    # Bottom-left
    c.line(x, y, x, y - mark_len)
    c.line(x, y, x - mark_len, y)
    # Bottom-right
    c.line(x + w, y, x + w, y - mark_len)
    c.line(x + w, y, x + w + mark_len, y)


def draw_front_card(
    c: Canvas,
    x: float,
    y: float,
    w: float,
    h: float,
    card: CardData,
    font_name: str,
    footer_text: str,
    set_name: str,
    set_version: str,
    icon_size_mm: float = 10.0,
) -> None:
    """Draw a single card (front side) into the given rectangle."""
    # Card padding
    padding = 6 * mm
    inner_x = x + padding
    inner_y = y + padding
    inner_w = w - padding * 2
    inner_h = h - padding * 2

    # Card border
    c.setStrokeColor(colors.black)
    c.rect(x, y, w, h, stroke=1, fill=0)

    # Icon area
    icon_box_h = icon_size_mm * mm
    if card.icon_path and svg2rlg is not None and renderPDF is not None:
        try:
            drawing = svg2rlg(str(card.icon_path))
            if drawing:
                scale = min(inner_w / drawing.width, icon_box_h / drawing.height)
                drawing.width *= scale
                drawing.height *= scale
                renderPDF.draw(drawing, c, inner_x + (inner_w - drawing.width) / 2, y + h - padding - drawing.height + 10)
        except Exception:
            pass

    # Title (wrap and shrink if needed)
    title_font_size = 12
    title_lines = _wrap_text(card.title, inner_w, title_font_size, font_name)
    if len(title_lines) > 2:
        # Reduce font size if title spans too many lines
        title_font_size = 10
        title_lines = _wrap_text(card.title, inner_w, title_font_size, font_name)

    c.setFont(font_name, title_font_size)
    title_y = y + h - padding - icon_box_h - 4 * mm
    line_spacing = (title_font_size * 0.6) * mm
    for line in title_lines:
        c.drawString(inner_x, title_y, line)
        title_y -= line_spacing

    # Description / note
    note_font_size = 9
    c.setFont(font_name, note_font_size)
    text_lines = _wrap_text(card.note, inner_w, note_font_size, font_name)
    text_y = title_y - 3 * mm
    for line in text_lines:
        if text_y < y + padding + 18 * mm:
            break
        c.drawString(inner_x, text_y, line)
        text_y -= 4.5 * mm

    # Footer
    footer_font_size = 7
    c.setFont(font_name, footer_font_size)
    footer_text_full = f"{set_name} {set_version}"
    if footer_text:
        footer_text_full = footer_text
    c.drawRightString(x + w - padding, y + padding / 2, footer_text_full)


def _wrap_text(text: str, max_width: float, font_size: float, font_name: str) -> List[str]:
    """Wrap text to fit within max_width."""
    if not text:
        return []

    words = text.split()
    lines: List[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if pdfmetrics.stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_back_card(c: Canvas, x: float, y: float, w: float, h: float, number: int, font_name: str) -> None:
    """Draw a back side of a card with a number."""
    padding = 6 * mm
    c.setStrokeColor(colors.black)
    c.rect(x, y, w, h, stroke=1, fill=0)

    num_font_size = 72
    c.setFont(font_name, num_font_size)
    text = str(number)
    text_w = pdfmetrics.stringWidth(text, font_name, num_font_size)
    c.drawString(x + (w - text_w) / 2, y + (h - num_font_size) / 2, text)


def build_pdf(output_path: Path, set_name: str, set_version: str, footer_text: str, cards: List[CardData], icon_size_mm: float = 30.0) -> None:
    """Build PDF with front/back pages."""
    page_size = landscape(A4)
    page_w, page_h = page_size
    card_w = page_w / 4.0
    card_h = page_h / 2.0

    font_name = register_font()

    # Ensure correct number of cards
    cards = ensure_card_count(cards)
    total_cards = len(cards)

    # Assign numbers for the back side (equal count for 1..6)
    repeats = total_cards // 6
    numbers = [i for i in range(1, 7) for _ in range(repeats)]
    random.shuffle(numbers)

    c = Canvas(str(output_path), pagesize=page_size)

    # Front pages
    for idx, card in enumerate(cards):
        page_idx = idx // 8
        pos_on_page = idx % 8
        if pos_on_page == 0 and idx != 0:
            c.showPage()

        col = pos_on_page % 4
        row = pos_on_page // 4
        x = col * card_w
        y = page_h - (row + 1) * card_h

        _draw_crop_marks(c, x, y, card_w, card_h)
        draw_front_card(c, x, y, card_w, card_h, card, font_name, footer_text, set_name, set_version, icon_size_mm)

    c.showPage()

    # Back pages
    for idx, number in enumerate(numbers):
        page_idx = idx // 8
        pos_on_page = idx % 8
        if pos_on_page == 0 and idx != 0:
            c.showPage()

        col = pos_on_page % 4
        row = pos_on_page // 4
        x = col * card_w
        y = page_h - (row + 1) * card_h

        _draw_crop_marks(c, x, y, card_w, card_h)
        draw_back_card(c, x, y, card_w, card_h, number, font_name)

    c.save()


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Generate printable card sheets from a JSON dataset.")
    parser.add_argument("dataset", help="Path to the dataset JSON file")
    parser.add_argument(
        "--output",
        "-o",
        help="Output PDF file path. Defaults to <dataset_name>_cards.pdf in the dataset folder.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Optional random seed to make number distribution deterministic.",
    )
    parser.add_argument(
        "--icon-size",
        type=float,
        default=30.0,
        help="Icon size in mm (default: 30).",
    )

    args = parser.parse_args(argv)

    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        print(f"Dataset file does not exist: {dataset_path}", file=sys.stderr)
        return 2

    set_name, set_version, footer_text, cards = load_cards_from_dataset(dataset_path)

    if args.seed is not None:
        random.seed(args.seed)

    if args.output:
        output_path = Path(args.output)
    else:
        out_dir = dataset_path.parent
        base = dataset_path.stem
        output_path = out_dir / f"{base}_cards.pdf"

    output_path.parent.mkdir(parents=True, exist_ok=True)
    build_pdf(output_path, set_name, set_version, footer_text, cards, args.icon_size)

    print(f"Generated: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
