import datetime
import re
from io import BytesIO
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

try:
    from PIL import Image as PILImage
    from PIL import ImageDraw
except ImportError:  # pragma: no cover
    PILImage = None
    ImageDraw = None

from app.database import get_db
from app.models.affectation import Affectation as AffectationModel
from app.models.eleve import Eleve
from app.models.lego_set import LegoSet
from app.models.session import Session as SessionModel

router = APIRouter(prefix="/reports")

# Constante de conversion : points par centimètre
CM = 28.3465


def _resolve_repo_root() -> Path:
    """Résout la racine du dépôt (même logique que app/main.py)."""
    candidates = [
        Path("/app"),
        Path(__file__).resolve().parents[3],
        Path(__file__).resolve().parents[2],
        Path(__file__).resolve().parents[1],
    ]
    for candidate in candidates:
        if (candidate / "frontend" / "build").exists():
            return candidate
    return Path(__file__).resolve().parents[3]


REPO_ROOT = _resolve_repo_root()

# Le logo du projet (présent dans build/ en Docker, public/ en local)
LOGO_PATH = next(
    (
        p
        for p in [
            REPO_ROOT / "frontend" / "build" / "Logo CLUB LEGO web.png",
            REPO_ROOT / "frontend" / "public" / "Logo CLUB LEGO web.png",
            REPO_ROOT / "frontend" / "build" / "favicon.ico",
            REPO_ROOT / "frontend" / "public" / "favicon.ico",
        ]
        if p.exists()
    ),
    None,
)

# Dossier des icônes (présent dans build/ en Docker, public/ en local)
ICONS_DIR = next(
    (
        p
        for p in [
            REPO_ROOT / "frontend" / "build" / "icons",
            REPO_ROOT / "frontend" / "public" / "icons",
        ]
        if p.exists()
    ),
    None,
)

# Couleurs des icônes (RGBA)
ICON_COLORS = {
    "eleves": (13, 110, 253, 255),      # bleu
    "sets": (253, 126, 20, 255),        # orange
    "affectation": (25, 135, 84, 255),  # vert
}

# Nom des jours (index 0 = lundi) et couleur propre à chaque histogramme
WEEKDAYS = [
    ("Lundi", "#1f77b4"),
    ("Mardi", "#ff7f0e"),
    ("Mercredi", "#2ca02c"),
    ("Jeudi", "#d62728"),
    ("Vendredi", "#9467bd"),
    ("Samedi", "#8c564b"),
    ("Dimanche", "#e377c2"),
]


# --- Helpers (même logique que le tableau de bord) -------------------------
def _niveau_label(classe: str) -> str:
    """Transforme une classe en libellé de niveau (ex. "6e" -> "6ème")."""
    classe_nettoyee = str(classe or "").strip()
    match = re.match(r"^(\d+)\s*(?:e|ème|eme|er|ère)?(?:\s+.*)?$", classe_nettoyee, re.IGNORECASE)
    return f"{match.group(1)}ème" if match else classe_nettoyee


def _classe_sort_value(niveau: str) -> int:
    match = re.search(r"\d+", niveau)
    return int(match.group(0)) if match else 0


def _load_logo_png(path, max_size=256):
    """Charge le logo et le réduit en octets PNG."""
    if path is None or PILImage is None:
        return None
    try:
        with open(path, "rb") as logo_file:
            logo_bytes = logo_file.read()
        pil_logo = PILImage.open(BytesIO(logo_bytes))
        pil_logo = pil_logo.convert("RGBA")
        pil_logo.thumbnail((max_size, max_size), PILImage.LANCZOS)
        buf = BytesIO()
        pil_logo.save(buf, format="PNG")
        return buf.getvalue()
    except Exception:
        return None


def _load_icon_png(name, max_size=128):
    """Charge une icône PNG depuis le dossier icons."""
    if ICONS_DIR is None or PILImage is None:
        return None
    path = ICONS_DIR / name
    if not path.exists():
        return None
    try:
        with open(path, "rb") as icon_file:
            icon_bytes = icon_file.read()
        img = PILImage.open(BytesIO(icon_bytes))
        img = img.convert("RGBA")
        img.thumbnail((max_size, max_size), PILImage.LANCZOS)
        buf = BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except Exception:
        return None


def _make_icon_png(kind, size=64):
    """Dessine une icône simple (élèves, sets, affectation) et renvoie ses octets PNG."""
    if PILImage is None or ImageDraw is None:
        return None
    try:
        scale = 4
        canvas_size = size * scale
        img = PILImage.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        unit = canvas_size / 24.0

        def X(value):
            return value * unit

        fill = ICON_COLORS.get(kind, ICON_COLORS["eleves"])

        if kind == "eleves":
            # Deux personnes (élèves)
            draw.ellipse([X(3), X(3), X(9), X(9)], fill=fill)
            draw.chord([X(2), X(9), X(10), X(19)], 180, 360, fill=fill)
            draw.ellipse([X(15), X(3), X(21), X(9)], fill=fill)
            draw.chord([X(14), X(9), X(22), X(19)], 180, 360, fill=fill)
        elif kind == "sets":
            # Brique LEGO (sets)
            draw.rectangle([X(3), X(9), X(21), X(20)], fill=fill)
            for cx in (6.5, 12, 17.5):
                draw.ellipse([X(cx - 1.5), X(5), X(cx + 1.5), X(9)], fill=fill)
        elif kind == "affectation":
            # Presse-papiers (affectation)
            draw.rectangle([X(5), X(4), X(19), X(21)], fill=fill)
            draw.rectangle([X(9), X(2), X(15), X(6)], fill=fill)
            line_color = (255, 255, 255, 255)
            line_width = max(1, int(1.2 * unit))
            draw.line([X(8), X(10), X(16), X(10)], fill=line_color, width=line_width)
            draw.line([X(8), X(13), X(16), X(13)], fill=line_color, width=line_width)
            draw.line([X(8), X(16), X(13), X(16)], fill=line_color, width=line_width)

        img = img.resize((size, size), PILImage.LANCZOS)
        buf = BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except Exception:
        return None


@router.get("/pdf")
def generate_report(start: str, end: str, db: Session = Depends(get_db)):
    """Génère un compte-rendu PDF reprenant le tableau du tableau de bord."""
    # --- Dates -------------------------------------------------------------
    try:
        start_date = datetime.datetime.strptime(start, "%Y-%m-%d").date()
        end_date = datetime.datetime.strptime(end, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    start_fr = start_date.strftime("%d/%m/%Y")
    end_fr = end_date.strftime("%d/%m/%Y")

    # --- Données de base ---------------------------------------------------
    eleves_all = db.query(Eleve).all()
    eleves_by_id = {e.id: e for e in eleves_all}
    total_eleves = len(eleves_all)
    total_sets = db.query(LegoSet).count()

    # Élèves absents : inscrits mais n'ayant jamais assisté à une séance
    ids_avec_seance = {
        row[0] for row in db.query(AffectationModel.eleve_id).distinct().all()
    }
    absents = sum(1 for e in eleves_all if e.id not in ids_avec_seance)

    # Moyenne des pièces par set (arrondie à l'unité)
    moyenne_pieces = db.query(func.avg(LegoSet.nombre_pieces)).scalar()
    moyenne_pieces = int(round(moyenne_pieces)) if moyenne_pieces is not None else 0

    # Niveaux présents (même calcul et même tri que le dashboard)
    niveaux = sorted(
        {_niveau_label(e.classe) for e in eleves_all if e.classe},
        key=lambda n: (-_classe_sort_value(n), n),
    )

    # Sessions de la période
    sessions: List[SessionModel] = (
        db.query(SessionModel)
        .filter(SessionModel.date >= start_date, SessionModel.date <= end_date)
        .order_by(SessionModel.date)
        .all()
    )

    # --- Lignes du tableau + récap par jour de semaine ------------------
    rows = []
    sessions_by_weekday = {i: [] for i in range(7)}
    for s in sessions:
        affectations = (
            db.query(AffectationModel).filter(AffectationModel.session_id == s.id).all()
        )
        eleves_session = set()
        par_niveau = {niveau: set() for niveau in niveaux}
        for aff in affectations:
            eleve = eleves_by_id.get(aff.eleve_id)
            if eleve is None:
                continue
            eleves_session.add(eleve.id)
            niveau = _niveau_label(eleve.classe)
            if niveau in par_niveau:
                par_niveau[niveau].add(eleve.id)

        sets_complets = len(
            {aff.lego_set_id for aff in affectations if aff.statut == "complet"}
        )
        nbre_eleves = len(eleves_session)

        rows.append(
            {
                "date": s.date.strftime("%d/%m/%Y"),
                "creneau": s.creneau or "",
                "nbre_eleves": nbre_eleves,
                "par_niveau": {niveau: len(ids) for niveau, ids in par_niveau.items()},
                "sets_complets": sets_complets,
            }
        )
        sessions_by_weekday[s.date.weekday()].append({"date": s.date, "nbre_eleves": nbre_eleves})

    # --- Génération du PDF -------------------------------------------------
    try:
        from reportlab.lib import colors
        from reportlab.lib.colors import HexColor
        from reportlab.lib.enums import TA_CENTER
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib.utils import ImageReader
        from reportlab.graphics import renderPDF
        from reportlab.graphics.charts.barcharts import VerticalBarChart
        from reportlab.graphics.shapes import Drawing, Line, String, Group
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
        from reportlab.platypus.flowables import Flowable
        from reportlab.pdfbase.pdfmetrics import stringWidth
    except ImportError:
        raise HTTPException(status_code=500, detail="Reportlab library not installed")

    class DrawingFlowable(Flowable):
        """Adapte un Drawing reportlab pour l'utiliser dans un flux platypus."""

        def __init__(self, drawing, width, height):
            Flowable.__init__(self)
            self.drawing = drawing
            self.width = width
            self.height = height

        def draw(self):
            renderPDF.draw(self.drawing, self.canv, 0, 0)

    class LogoFlowable(Flowable):
        """Affiche une image (octets PNG) via le canvas ReportLab."""

        def __init__(self, image_bytes, width, height):
            Flowable.__init__(self)
            self.image_bytes = image_bytes
            self.width = width
            self.height = height

        def draw(self):
            self.canv.drawImage(
                ImageReader(BytesIO(self.image_bytes)),
                0,
                0,
                width=self.width,
                height=self.height,
                mask="auto",
            )

    def make_bar_chart(labels, values, color_hex, width, height, avg_value):
        drawing = Drawing(width, height)
        chart = VerticalBarChart()
        chart.x = 30
        chart.y = 30
        chart.width = width - 60
        chart.height = height - 70
        chart.data = [list(values)]
        chart.categoryAxis.categoryNames = list(labels)
        chart.categoryAxis.labels.angle = 30
        chart.categoryAxis.labels.dy = -8
        chart.categoryAxis.labels.fontSize = 6
        chart.valueAxis.valueMin = 0
        chart.valueAxis.valueStep = 1
        chart.barWidth = 8
        chart.groupSpacing = 8
        chart.bars[0].fillColor = HexColor(color_hex)

        # Ligne de moyenne (annotation ReportLab appelée avec l'échelle de l'axe des valeurs)
        def _average_annotation(chart, category_scale, value_scale):
            y = value_scale(avg_value)
            x0 = chart.x
            x1 = chart.x + chart.width
            line = Line(
                x0, y, x1, y,
                strokeColor=colors.black,
                strokeWidth=1,
                strokeDashArray=[3, 3],
            )
            label = String(
                x1 - 70, y + 3,
                f"moyenne: {avg_value:.1f}",
                fontName="Helvetica-Bold",
                fontSize=7,
                fillColor=colors.black,
            )
            return Group(line, label)

        chart.annotations = [_average_annotation]
        drawing.add(chart)
        return drawing

    def make_icon_text_table(icon_png, text_paragraph, icon_size, gap=0.1 * CM):
        """Tableau [icône, texte] pour afficher une icône devant un libellé."""
        cells = [text_paragraph]
        col_widths = [None]
        if icon_png is not None:
            cells.insert(0, LogoFlowable(icon_png, icon_size, icon_size))
            col_widths.insert(0, icon_size + gap)
        return Table([cells], colWidths=col_widths)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.3 * inch,
        bottomMargin=0.5 * inch,
    )

    elements = []

    # --- Ressources graphiques -----------------------------------------
    logo_png = _load_logo_png(LOGO_PATH, max_size=512)
    # Icônes depuis frontend/{build,public}/icons/ (fallback dessiné)
    eleves_icon_png = _load_icon_png("users.png") or _make_icon_png("eleves")
    sets_icon_png = _load_icon_png("blocks.png") or _make_icon_png("sets")
    affectation_icon_png = _load_icon_png("calendar-days.png") or _make_icon_png(
        "affectation"
    )

    logo_size = 2.7 * CM  # logo agrandi x3
    icon_size = 0.45 * CM

    title_style = ParagraphStyle(
        "title",
        fontName="Helvetica-Bold",
        fontSize=16,
        alignment=TA_CENTER,
    )
    period_style = ParagraphStyle(
        "period", fontName="Helvetica", fontSize=12, alignment=TA_CENTER
    )
    subtitle_style = ParagraphStyle("subtitle", fontName="Helvetica", fontSize=12)
    chart_title_style = ParagraphStyle(
        "chart_title", fontName="Helvetica-Bold", fontSize=12
    )

    # --- En-tête : titre (en haut, centré) + période, logo à côté ----
    title_paragraph = Paragraph("Compte-rendu du Club LEGO", title_style)
    period_paragraph = Paragraph(f"Période du {start_fr} au {end_fr}", period_style)
    if logo_png is not None:
        # Largeurs naturelles pour centrer le titre sur la feuille
        title_w = stringWidth(
            "Compte-rendu du Club LEGO", title_style.fontName, title_style.fontSize
        )
        period_w = stringWidth(
            f"Période du {start_fr} au {end_fr}",
            period_style.fontName,
            period_style.fontSize,
        )
        content_w = max(title_w, period_w)
        logo_col = logo_size + 0.2 * CM
        page_center = doc.width / 2.0
        left_pad = max(0.0, page_center - logo_col - content_w / 2.0)
        right_pad = max(0.0, page_center - content_w / 2.0)
        header_table = Table(
            [
                [
                    "",
                    LogoFlowable(logo_png, logo_size, logo_size),
                    [
                        title_paragraph,
                        Spacer(1, 0.2 * CM),
                        period_paragraph,
                    ],
                    "",
                ]
            ],
            colWidths=[left_pad, logo_col, content_w, right_pad],
        )
        header_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        elements.append(header_table)
    else:
        elements.append(title_paragraph)
        elements.append(Spacer(1, 0.2 * CM))
        elements.append(period_paragraph)

    # Espacement réduit entre la période et la 1ère ligne « élèves inscrits »
    elements.append(Spacer(1, 0.5 * CM))

    # --- Récapitulatif (icônes devant les libellés) --------------
    # Espacement de 0,5 entre les deux lignes
    def _icon_cell(icon_png):
        if icon_png is not None:
            return LogoFlowable(icon_png, icon_size, icon_size)
        return ""

    summary_data = [
        [
            _icon_cell(eleves_icon_png),
            Paragraph(f"Élèves inscrits : {total_eleves}", subtitle_style),
            "",
            Paragraph(f"Absents : {absents}", subtitle_style),
        ],
        [Spacer(1, 0.5 * CM), "", "", ""],
        [
            _icon_cell(sets_icon_png),
            Paragraph(f"Sets au total : {total_sets}", subtitle_style),
            "",
            Paragraph(f"Moyenne pièces/set : {moyenne_pieces}", subtitle_style),
        ],
    ]
    summary_table = Table(
        summary_data,
        colWidths=[
            icon_size + 0.1 * CM,
            2.9 * inch,
            0.4 * inch,
            2.9 * inch,
        ],
    )
    summary_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    elements.append(summary_table)

    # Espacement de 1,5 entre la ligne « sets au total » et le tableau
    elements.append(Spacer(1, 1.5 * CM))

    # En-têtes du tableau
    header = ["Date", "Créneau", "Élèves"] + niveaux + ["Sets complets"]
    data = [header]
    for row in rows:
        data.append(
            [
                row["date"],
                row["creneau"],
                str(row["nbre_eleves"]),
            ]
            + [str(row["par_niveau"].get(niveau, 0)) for niveau in niveaux]
            + [str(row["sets_complets"])]
        )
    if not rows:
        data.append(["Aucune session trouvée sur cette période"] + [""] * (len(header) - 1))

    # Largeurs des colonnes
    disponible = doc.width
    fixed = [0.9 * inch, 1.1 * inch, 0.7 * inch, 1.0 * inch]  # Date, Créneau, Élèves, Sets complets
    niveau_width = max(0.6 * inch, (disponible - sum(fixed)) / max(len(niveaux), 1))
    col_widths = fixed[:3] + [niveau_width] * len(niveaux) + [fixed[3]]

    table_style = TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0d6efd")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f2f2")]),
        ]
    )
    elements.append(Table(data, colWidths=col_widths, style=table_style, repeatRows=1))

    # --- Histogrammes par jour de la semaine ---------------------------
    for weekday_index, (weekday_name, weekday_color) in enumerate(WEEKDAYS):
        sessions_du_jour = sessions_by_weekday.get(weekday_index, [])
        if not sessions_du_jour:
            continue  # Pas d'histogramme si aucune séance ce jour-là

        labels = [s["date"].strftime("%d/%m") for s in sessions_du_jour]
        values = [s["nbre_eleves"] for s in sessions_du_jour]
        moyenne = round(sum(values) / len(values), 1)

        # Titre de l'histogramme avec l'icône affectation
        elements.append(Spacer(1, 12))
        elements.append(
            make_icon_text_table(
                affectation_icon_png,
                Paragraph(f"Élèves par séance - {weekday_name}", chart_title_style),
                icon_size,
            )
        )
        elements.append(Spacer(1, 6))
        elements.append(
            DrawingFlowable(
                make_bar_chart(labels, values, weekday_color, doc.width, 200, moyenne),
                doc.width,
                200,
            )
        )
        elements.append(Spacer(1, 0.2 * inch))

    doc.build(elements)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=rapport.pdf"},
    )
