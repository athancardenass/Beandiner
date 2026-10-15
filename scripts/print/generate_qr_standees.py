"""Generate the Bean Diner tabletop QR standee proposal."""

from __future__ import annotations

import base64
import html
import os
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode.qr import QrCodeWidget


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "artifacts" / "print" / "qr-standee-proposal"
LOGO_PATH = ROOT / "public" / "images" / "bean_diner_logo_white.png"
TEMP_PDF = ROOT / "tmp" / "pdfs" / "qr-standees-untrimmed.pdf"
PDF_PATH = OUTPUT_DIR / "qr-standees.pdf"
SVG_PATH = OUTPUT_DIR / "table-standee-template.svg"

QR_URL = "https://beandiner.vercel.app/"
TABLE_NUMBERS = tuple(range(1, 21))

PAGE_W_MM = 156
PAGE_H_MM = 206
TRIM_MM = 3
TRIM_W_MM = 150
TRIM_H_MM = 200
QR_BORDER_MODULES = 4
QR_PANEL_MM = 94
QR_SIZE_MM = 82

COLORS = {
    "espresso": "#121212",
    "raised": "#1C1C1C",
    "cream": "#FFF0D6",
    "cream_card": "#FFF8EB",
    "cream_deep": "#F3DFC3",
    "tan": "#D49E77",
    "tan_dark": "#B9825F",
}

FONT_REGULAR = "Georgia"
FONT_BOLD = "Georgia-Bold"
SANS_REGULAR = "Arial"
SANS_BOLD = "Arial-Bold"


def register_fonts() -> None:
    global FONT_REGULAR, FONT_BOLD, SANS_REGULAR, SANS_BOLD
    fonts_dir = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
    regular = fonts_dir / "georgia.ttf"
    bold = fonts_dir / "georgiab.ttf"
    sans = fonts_dir / "arial.ttf"
    sans_bold = fonts_dir / "arialbd.ttf"
    if all(path.is_file() for path in (regular, bold, sans, sans_bold)):
        pdfmetrics.registerFont(TTFont(FONT_REGULAR, str(regular)))
        pdfmetrics.registerFont(TTFont(FONT_BOLD, str(bold)))
        pdfmetrics.registerFont(TTFont(SANS_REGULAR, str(sans)))
        pdfmetrics.registerFont(TTFont(SANS_BOLD, str(sans_bold)))
    else:
        FONT_REGULAR, FONT_BOLD = "Times-Roman", "Times-Bold"
        SANS_REGULAR, SANS_BOLD = "Helvetica", "Helvetica-Bold"


def build_qr_matrix() -> list[list[bool]]:
    widget = QrCodeWidget(QR_URL, barLevel="H", barBorder=QR_BORDER_MODULES)
    widget.qr.make()
    if widget.value != QR_URL:
        raise RuntimeError("ReportLab QR widget did not retain the configured destination")
    return [[bool(module) for module in row] for row in widget.qr.modules]


def draw_tracking_text(
    pdf: canvas.Canvas,
    text: str,
    center_x: float,
    baseline_from_top_mm: float,
    font_name: str,
    font_size_pt: float,
    color: str,
    char_space_pt: float,
) -> None:
    pdf.saveState()
    pdf.setFillColor(HexColor(color))
    text_obj = pdf.beginText()
    text_obj.setFont(font_name, font_size_pt)
    text_obj.setCharSpace(char_space_pt)
    text_width = pdfmetrics.stringWidth(text, font_name, font_size_pt)
    tracking_width = max(0, len(text) - 1) * char_space_pt
    text_obj.setTextOrigin(center_x * mm - (text_width + tracking_width) / 2, (PAGE_H_MM - baseline_from_top_mm) * mm)
    text_obj.textLine(text)
    pdf.drawText(text_obj)
    pdf.restoreState()


def draw_pdf_qr(pdf: canvas.Canvas, matrix: list[list[bool]], panel_top_mm: float) -> None:
    panel_x_mm = (PAGE_W_MM - QR_PANEL_MM) / 2
    panel_bottom_mm = PAGE_H_MM - panel_top_mm - QR_PANEL_MM
    qr_x_mm = (PAGE_W_MM - QR_SIZE_MM) / 2
    qr_top_mm = panel_top_mm + (QR_PANEL_MM - QR_SIZE_MM) / 2
    module_total = len(matrix) + QR_BORDER_MODULES * 2
    module_mm = QR_SIZE_MM / module_total

    pdf.saveState()
    pdf.setFillColor(HexColor(COLORS["cream_card"]))
    pdf.roundRect(panel_x_mm * mm, panel_bottom_mm * mm, QR_PANEL_MM * mm, QR_PANEL_MM * mm, 4 * mm, fill=1, stroke=0)
    pdf.setFillColor(HexColor(COLORS["espresso"]))
    for row_index, row in enumerate(matrix):
        col_index = 0
        while col_index < len(row):
            if not row[col_index]:
                col_index += 1
                continue
            run_end = col_index + 1
            while run_end < len(row) and row[run_end]:
                run_end += 1
            rect_x = qr_x_mm + (QR_BORDER_MODULES + col_index) * module_mm
            rect_top = qr_top_mm + (QR_BORDER_MODULES + row_index) * module_mm
            rect_width = (run_end - col_index) * module_mm
            pdf.rect(rect_x * mm, (PAGE_H_MM - rect_top - module_mm) * mm, rect_width * mm, module_mm * mm, fill=1, stroke=0)
            col_index = run_end
    pdf.restoreState()


def draw_page(pdf: canvas.Canvas, table_number: int, matrix: list[list[bool]]) -> None:
    pdf.setFillColor(HexColor(COLORS["espresso"]))
    pdf.rect(0, 0, PAGE_W_MM * mm, PAGE_H_MM * mm, fill=1, stroke=0)

    # The frame stays 5.5 mm inside the finished trim edge.
    pdf.setStrokeColor(HexColor(COLORS["tan"]))
    pdf.setLineWidth(0.45)
    pdf.roundRect(8.5 * mm, (PAGE_H_MM - 197.5) * mm, 139 * mm, 189 * mm, 5 * mm, fill=0, stroke=1)

    # Existing mark plus the site's serif wordmark and Bayambang lockup.
    logo_size_mm = 17
    logo_x_mm = 49.5
    logo_top_mm = 13.5
    pdf.drawImage(str(LOGO_PATH), logo_x_mm * mm, (PAGE_H_MM - logo_top_mm - logo_size_mm) * mm,
                  width=logo_size_mm * mm, height=logo_size_mm * mm, mask="auto", preserveAspectRatio=True, anchor="c")
    pdf.setFillColor(HexColor(COLORS["cream"]))
    pdf.setFont(FONT_REGULAR, 20)
    pdf.drawString(logo_x_mm * mm + 21 * mm, (PAGE_H_MM - 23.8) * mm, "bean diner")
    draw_tracking_text(pdf, "BAYAMBANG", 88.7, 29.8, SANS_BOLD, 6.4, COLORS["tan"], 1.15)

    pdf.setStrokeColor(HexColor(COLORS["tan"]))
    pdf.setLineWidth(0.55)
    pdf.line(57 * mm, (PAGE_H_MM - 37) * mm, 99 * mm, (PAGE_H_MM - 37) * mm)
    pdf.setFillColor(HexColor(COLORS["tan"]))
    pdf.circle(PAGE_W_MM / 2 * mm, (PAGE_H_MM - 37) * mm, 0.8 * mm, fill=1, stroke=0)

    draw_tracking_text(pdf, "SCAN TO EXPLORE OUR MENU", PAGE_W_MM / 2, 46.5, SANS_BOLD, 9.3, COLORS["cream"], 1.25)
    draw_pdf_qr(pdf, matrix, panel_top_mm=53)

    table_label = f"TABLE {table_number:02d}"
    badge_w_mm, badge_h_mm = 57, 18
    badge_x_mm = (PAGE_W_MM - badge_w_mm) / 2
    badge_top_mm = 159
    pdf.setFillColor(HexColor(COLORS["tan"]))
    pdf.roundRect(badge_x_mm * mm, (PAGE_H_MM - badge_top_mm - badge_h_mm) * mm,
                  badge_w_mm * mm, badge_h_mm * mm, 9 * mm, fill=1, stroke=0)
    draw_tracking_text(pdf, table_label, PAGE_W_MM / 2, 170.5, SANS_BOLD, 10.2, COLORS["espresso"], 1.0)

    draw_tracking_text(pdf, "BAYAMBANG, PANGASINAN", PAGE_W_MM / 2, 190, SANS_BOLD, 6.4, COLORS["cream_deep"], 0.8)


def svg_text(
    text: str,
    x_mm: float,
    y_mm: float,
    size_mm: float,
    fill: str,
    family: str,
    weight: str = "400",
    letter_spacing_mm: float = 0,
    anchor: str = "middle",
) -> str:
    return (
        f'<text x="{x_mm:.3f}" y="{y_mm:.3f}" text-anchor="{anchor}" '
        f'font-family="{family}" font-size="{size_mm:.3f}" font-weight="{weight}" '
        f'letter-spacing="{letter_spacing_mm:.3f}" fill="{fill}">{html.escape(text)}</text>'
    )


def make_svg(table_number: int, matrix: list[list[bool]]) -> str:
    logo_data = base64.b64encode(LOGO_PATH.read_bytes()).decode("ascii")
    panel_left = (PAGE_W_MM - QR_PANEL_MM) / 2
    qr_left = (PAGE_W_MM - QR_SIZE_MM) / 2
    qr_top = 53 + (QR_PANEL_MM - QR_SIZE_MM) / 2
    module_total = len(matrix) + QR_BORDER_MODULES * 2
    module_mm = QR_SIZE_MM / module_total
    qr_rectangles: list[str] = []
    for row_index, row in enumerate(matrix):
        col_index = 0
        while col_index < len(row):
            if not row[col_index]:
                col_index += 1
                continue
            run_end = col_index + 1
            while run_end < len(row) and row[run_end]:
                run_end += 1
            x = qr_left + (QR_BORDER_MODULES + col_index) * module_mm
            y = qr_top + (QR_BORDER_MODULES + row_index) * module_mm
            width = (run_end - col_index) * module_mm
            qr_rectangles.append(
                f'<rect x="{x:.4f}" y="{y:.4f}" width="{width:.4f}" height="{module_mm:.4f}" fill="{COLORS["espresso"]}"/>'
            )
            col_index = run_end

    table_label = f"TABLE {table_number:02d}"
    svg_parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{PAGE_W_MM}mm" height="{PAGE_H_MM}mm" viewBox="0 0 {PAGE_W_MM} {PAGE_H_MM}" role="img" aria-label="Bean Diner Table {table_number:02d} QR standee">',
        '<title>Bean Diner tabletop QR standee - Table 01 editable template</title>',
        '<desc>Print trim 150 by 200 millimetres with 3 millimetres bleed on each side.</desc>',
        f'<rect width="{PAGE_W_MM}" height="{PAGE_H_MM}" fill="{COLORS["espresso"]}"/>',
        f'<rect x="8.5" y="8.5" width="139" height="189" rx="5" fill="none" stroke="{COLORS["tan"]}" stroke-width="0.45"/>',
        f'<image href="data:image/png;base64,{logo_data}" x="49.5" y="13.5" width="17" height="17" preserveAspectRatio="xMidYMid meet"/>',
        svg_text("bean diner", 70.5, 24.1, 7.05, COLORS["cream"], "Georgia, serif", "400", 0, "start"),
        svg_text("BAYAMBANG", 88.7, 29.8, 2.25, COLORS["tan"], "Arial, sans-serif", "700", 0.4),
        f'<line x1="57" y1="37" x2="99" y2="37" stroke="{COLORS["tan"]}" stroke-width="0.55"/>',
        f'<circle cx="78" cy="37" r="0.8" fill="{COLORS["tan"]}"/>',
        svg_text("SCAN TO EXPLORE OUR MENU", 78, 46.5, 3.28, COLORS["cream"], "Arial, sans-serif", "700", 0.34),
        f'<rect x="{panel_left}" y="53" width="{QR_PANEL_MM}" height="{QR_PANEL_MM}" rx="4" fill="{COLORS["cream_card"]}"/>',
        *qr_rectangles,
        f'<rect x="49.5" y="159" width="57" height="18" rx="9" fill="{COLORS["tan"]}"/>',
        svg_text(table_label, 78, 170.5, 3.6, COLORS["espresso"], "Arial, sans-serif", "700", 0.28),
        svg_text("BAYAMBANG, PANGASINAN", 78, 190, 2.25, COLORS["cream_deep"], "Arial, sans-serif", "700", 0.28),
        '</svg>',
    ]
    return "\n".join(svg_parts)


def write_pdf(matrix: list[list[bool]]) -> None:
    TEMP_PDF.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(TEMP_PDF), pagesize=(PAGE_W_MM * mm, PAGE_H_MM * mm), pageCompression=1)
    pdf.setTitle("Bean Diner Table QR Standee Proposal")
    pdf.setAuthor("Bean Diner")
    pdf.setSubject("20 table QR standees, 150 x 200 mm trim with 3 mm bleed")
    for table_number in TABLE_NUMBERS:
        draw_page(pdf, table_number, matrix)
        pdf.showPage()
    pdf.save()

    reader = PdfReader(str(TEMP_PDF))
    writer = PdfWriter()
    for page in reader.pages:
        page.trimbox = RectangleObject([
            TRIM_MM * mm,
            TRIM_MM * mm,
            (TRIM_MM + TRIM_W_MM) * mm,
            (TRIM_MM + TRIM_H_MM) * mm,
        ])
        writer.add_page(page)
    writer.add_metadata({
        "/Title": "Bean Diner Table QR Standee Proposal",
        "/Author": "Bean Diner",
        "/Subject": "20 table QR standees; 150 x 200 mm trim, 3 mm bleed",
    })
    with PDF_PATH.open("wb") as stream:
        writer.write(stream)
    TEMP_PDF.unlink(missing_ok=True)


def main() -> None:
    if not LOGO_PATH.is_file():
        raise FileNotFoundError(f"Bean Diner logo not found: {LOGO_PATH}")
    register_fonts()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    matrix = build_qr_matrix()
    write_pdf(matrix)
    SVG_PATH.write_text(make_svg(1, matrix), encoding="utf-8")
    print(f"Created {PDF_PATH.name}: 20 pages at 156 x 206 mm with 150 x 200 mm trim.")
    print(f"Created {SVG_PATH.name}: editable TABLE 01 vector template.")


if __name__ == "__main__":
    main()
